const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const proxyConfig = require('./conf.json');

let banned = false;

let proxyProcess, crawlProcess;

function formatDate() {
	const today = new Date();
	return today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
}

function formatDateTime() {
	return new Date().toLocaleString();
}

function spawnProxy() {
	let notCrawling = true;

	proxyProcess = spawn('scrapoxy', [ 'start', 'conf.json', '-d' ]);
	proxyProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
		fs.appendFileSync(path.resolve(`./logs/proxy/${formatDate()}`), `${formatDateTime()} -- ${data}`);
	});

	proxyProcess.stderr.on('data', (data) => {
		console.log(`stderr:  ${formatDateTime()} -- ${data}`);
		fs.appendFileSync(path.resolve(`./logs/proxy/${formatDate()}`), `${formatDateTime()} -- ${data}`);

		if (notCrawling && String(data).search('changeAlive: true => true') >= 0) {
			notCrawling = false;
			spawnCrawl();
		}
	});

	proxyProcess.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}

function spawnCrawl() {
	crawlProcess = spawn('node', [ 'crawl.js' ]);
	crawlProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
		fs.appendFileSync(path.resolve(`./logs/crawl/${formatDate()}`), `${formatDateTime()} -- ${data}`);

		if (String(data).search('It was reported to us that your IP address') >= 0) {
			banned = true;

			axios
				.get('http://localhost:8889/api/instances', {
					headers: { Authorization: new Buffer(proxyConfig.commander.password).toString('base64') }
				})
				.then((res) => res.data)
				.then((data) => {
					const stopPromises = data.map((element) =>
						axios.post(
							'http://localhost:8889/api/instances/stop',
							{
								name: element.name
							},
							{
								headers: {
									Authorization: new Buffer(proxyConfig.commander.password).toString('base64')
								}
							}
						)
					);
					Promise.all(stopPromises).then((results) => {
						const success = results.reduce((pre, cur) => cur.status == 200 && pre, true);
						if (success) {
							// wait for 2 mins and restart the crawl process
							setTimeout(() => {
								spawnCrawl();
							}, 80000);
						} else {
							console.log('some instance is not stopped correctly!!');
						}
					});
				})
				.catch((err) => {
					console.log(err);
				});
		}
	});
	let errored = false;

	crawlProcess.stderr.on('data', (data) => {
		console.log(`crawl-stderr: ${data}`);
		console.log('going to restart in 2 min!');
		fs.appendFileSync(path.resolve(`./logs/crawl/${formatDate()}`), `${formatDateTime()} -- ${data}`);
		fs.appendFileSync(path.resolve(`./logs/crawl/${formatDate()}`), 'going to restart in 2 min!');

		if (!errored) {
			errored = true;

			console.time('Time restart');

			setTimeout(() => {
				console.timeEnd('Time restart');

				spawnCrawl();
			}, 120000);
		}
	});

	crawlProcess.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
		if (code == 1) {
		}
	});
}

spawnProxy();
