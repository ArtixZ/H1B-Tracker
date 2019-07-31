const { spawn } = require('child_process');

function spawnProxy() {
	const proxyProcess = spawn("scrapoxy", [ "start", "conf.json", "-d" ]);
	proxyProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
		if (data.find('required:1 / actual:1') > 0) {
			spawnCrawl();
		}
	});

	proxyProcess.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});

	proxyProcess.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}

function spawnCrawl() {
	const proxyProcess = spawn('node', [ 'crawl.js' ]);
	proxyProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	proxyProcess.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});

	proxyProcess.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}

function test() {
	const child = spawn('pwd');
	child.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	child.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});
	child.on('exit', function(code, signal) {
		console.log('child process exited with ' + `code ${code} and signal ${signal}`);
	});
}

spawnProxy();
