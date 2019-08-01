const { spawn } = require('child_process');
const axios = require('axios');

const proxyConfig = require('./conf.json');

let banned = false;

let proxyProcess, crawlProcess;

function spawnProxy() {
	let notCrawling = true;

	proxyProcess = spawn('scrapoxy', [ 'start', 'conf.json', '-d' ]);
	proxyProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	proxyProcess.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
		if (notCrawling && String(data).search('required:1 / actual:1') >= 0) {
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
							}, 120000);
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

	crawlProcess.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});

	crawlProcess.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}

function restartProxy() {}

function restartCrawl() {}

spawnProxy();
