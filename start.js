const { spawn } = require('child_process');
const axios = require('axios');

const proxyConfig = require('./conf.json');

let banned = false;

function spawnProxy() {
	let notCrawling = true;

	const proxyProcess = spawn('scrapoxy', [ 'start', 'conf.json', '-d' ]);
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
	const crawlProcess = spawn('node', [ 'crawl.js' ]);
	crawlProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
		if (String(data).search('It was reported to us that your IP address') >= 0) {
			axios
				.get('http://localhost:8889/api/instances', {
					headers: { Authorization: new Buffer(proxyConfig.commander.password).toString('base64') }
				})
				.then((res) => res.data)
				.then((data) => {
					const stopPromises = data.map((element) => {
						axios.post('http://localhost:8889/api/instances/stop', {
							headers: { Authorization: new Buffer(proxyConfig.commander.password).toString('base64') },
							body: {
								name: element.name
							}
						});
					});
					Promise.all(stopPromises).then((res) => {
						console.log(res);
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
