const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

let idIterator = require('./idGenerator');
const config = require('./configuration.json');
const url = 'https://egov.uscis.gov/casestatus/mycasestatus.do';

const { TIMEOUT_NO_BAN, CONCUR_THREAD, SLEEP_INTERVAL, SLEEP_PERIOD, SLEEP_INTERVAL_REQUEST_COUNT } = config;
// const q = queue(function(payload, callback) {

//     const bodyFormData = new FormData()
//     bodyFormData.append('appReceiptNum', payload.id)
//     bodyFormData.append('caseStatusSearchBtn', 'CHECK+STATUS')

//     axios({
//         method: 'POST',
//         url: url,
//         data: bodyFormData,
//         config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
//     }).then(res => {
//         console.log(res)
//         callback()
//     }).catch(err => {
//         console.log(err)
//     }, 2)
// })

function fetchResult(id) {
	const bodyFormData = new FormData();
	bodyFormData.append('appReceiptNum', id);
	bodyFormData.append('caseStatusSearchBtn', 'CHECK+STATUS');

	return axios({
		method: 'POST',
		url: url,
		data: bodyFormData,
		config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
	}).then((res) => res.data || null);
}

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ cptVT: { records: [], invalidRecords: [], currentIdx: 0, foundOne: false } }).write();

const whereILeft = db.get('cptVT').get('currentIdx').value();
const didIFoundOne = db.get('cptVT').get('foundOne').value();

function writeMessages(msgObjs) {
	if (Object.keys(msgObjs).length > 0) {
		db.get('cptVT').get('records').push(...msgObjs).write();
	}
}

function writeInvalidKeys(keys) {
	if (keys.length > 0) {
		db.get('cptVT').get('invalidRecords').push(...keys).write();
	}
}

const snooze = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let interval;

function startInterval() {
	interval = setInterval(async function() {
		console.log('!!!!!!!start sleep!!!!!!!!!!!!!!!!!');
		// await snooze(SLEEP_PERIOD*1000)
		sleepThread(SLEEP_PERIOD);
		console.log('!!!!!!!finish sleep!!!!!!!!!!!!!!!!!');
	}, SLEEP_INTERVAL * 1000);
}
function cleanInterval() {
	clearInterval(interval);
}

function msleep(n) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
function sleepThread(n) {
	msleep(n * 1000);
}

let requestCount = 0;

function startSleep() {
	console.log('!!!!!!!start sleep!!!!!!!!!!!!!!!!!');
	// await snooze(SLEEP_PERIOD*1000)
	sleepThread(SLEEP_PERIOD);
	console.log('!!!!!!!finish sleep!!!!!!!!!!!!!!!!!');
	requestCount = 0;
}

(async function main() {
	let banned = false;

	idIterator = idIterator(whereILeft);
	let currentIt = idIterator.next();
	// startInterval();

	let foundOne = didIFoundOne,
		subIt;
	while (!currentIt.done && !banned) {
		//  const res = await fetchResult(stringID)

		if (foundOne && invalidIds) {
			writeInvalidKeys(invalidIds);
		} else if (!foundOne && subIt && subIt.value.percentage >= 0.05) {
			writeInvalidKeys([ subIt.value.range ]);
		}

		db.get('cptVT').set('foundOne', foundOne).write();

		let subIdIterator = currentIt.value();
		subIt = subIdIterator.next();

		let invalidIds = [];

		while (!subIt.done && !banned && (foundOne || subIt.value.percentage < 0.05)) {
			let counter = 0,
				ids = [],
				reqAry = [],
				msgs = [],
				validMsgs = {},
				stringID;

			while (counter < CONCUR_THREAD) {
				await snooze(TIMEOUT_NO_BAN);
				stringID = subIt.value.stringID;
				reqAry.push(fetchResult(stringID));
				requestCount++;
				ids.push(stringID);

				subIt = subIdIterator.next();
				counter++;
			}

			let htmls = [];
			try {
				htmls = await Promise.all(reqAry);
				if (requestCount >= SLEEP_INTERVAL_REQUEST_COUNT) {
					startSleep();
				}
			} catch (err) {
				console.log('!!!!!!! ERROR !!!!!!those are the ids: ', ids);
				console.log(err);
			}
			// console.log(ids);
			// console.log(htmls);

			for (let html of htmls) {
				// console.log(html);
				const $ = cheerio.load(html);
				if ($('label[for=accessviolation]').text()) {
					console.log($('label[for=accessviolation]').text().trim());
					banned = true;
					break;
				}
				const message = $(
					'body > div.main-content-sec.pb40 > form > div > div.container > div > div > div.col-lg-12.appointment-sec.center > div.rows.text-center > h1'
				).text();
				msgs.push(message);
			}

			// drop current message stack if banned

			if (!banned) {
				//traverse messages got from website
				for (let i = 0; i < msgs.length; i++) {
					if (!!msgs[i]) {
						validMsgs[ids[i]] = msgs[i];
						foundOne = true;
						db.get('cptVT').set('foundOne', true).write();
					} else {
						invalidIds.push(ids[i]);
						console.log('==== INVALID IDs ====   ', ids[i]);
					}
				}

				// write data store it somewhere
				if (Object.keys(validMsgs).length) {
					writeMessages(validMsgs);
				}
				// if (invalidIds.length) {
				// 	writeInvalidKeys(invalidIds);
				// }

				db.get('cptVT').set('currentIdx', stringID).write();
			}
		}

		if (!banned) {
			currentIt = idIterator.next();
		}
	}

	// cleanInterval();
})();

// for(let id of idIterator) {
//     q.push({id}, function(err) {
//         console.log()
//     })
// }

// do{
//     let currentIt = idIterator.next()
//     let counter = 0

//     while(counter < CONCUR_THREAD && !currentIt.done) {

//         const bodyFormData = new FormData()
//         bodyFormData.append('appReceiptNum', id)
//         bodyFormData.append('caseStatusSearchBtn', 'CHECK+STATUS')

//         axios({
//             method: 'POST',
//             url: url,
//             data: bodyFormData,
//             config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
//         }).then(res => {
//             console.log(res)
//             callback()
//         }).catch(err => {
//             console.log(err)
//         })
//     }

// } while(!currentIt.done)

// // assign a callback
// q.drain(function() {
//     console.log('all items have been processed');
// });

// // assign an error callback
// q.error(function(err, task) {
//     console.error('task experienced an error');
// });
