const axios = require("axios")
const FormData = require('form-data')
const cheerio = require('cheerio')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const idIterator = require("./idGenerator")()
const config = require("./configuration.json")
const url = "https://egov.uscis.gov/casestatus/mycasestatus.do"

const {TIMEOUT_NO_BAN} = config
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

    const bodyFormData = new FormData()
    bodyFormData.append('appReceiptNum', id)
    bodyFormData.append('caseStatusSearchBtn', 'CHECK+STATUS')

    return axios({
        method: 'POST',
        url: url,
        data: bodyFormData,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
    }).then(res => res.data || null)

}

const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ "cptVT": { records:[], invalidRecords: [], currentIdx: "" } })
  .write()

function writeMessages(msgObjs) {
    if(Object.keys(msgObjs).length > 0) {
        db.get('cptVT')
        .get('records')
        .push(...msgObjs)
        .write()
    }
    
}

function writeInvalidKeys(keys) {
    if(keys.length > 0) {
        db.get('cptVT')
        .get('invalidRecords')
        .push(...keys)
        .write()
    }
    
}

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

let currentIt = idIterator.next();

(async function main() {
    let banned = false

    while(!currentIt.done && !banned) {
        //  const res = await fetchResult(currentIt.value)
        let reqAry = [],
        counter = 0,
        ids = [],
        msgs = [],
        validMsgs = {},
        invalidIds = []

        while(!currentIt.done && counter<10) {
            await snooze(TIMEOUT_NO_BAN)
            reqAry.push(fetchResult(currentIt.value))
            
            db.get('cptVT')
            .set('currentIdx', currentIt.value)

            ids.push(currentIt.value)

            currentIt = idIterator.next()
            counter ++
        }
    
        const htmls = await Promise.all(reqAry)

        // console.log(htmls)

        for(let html of htmls) {
            console.log(html)
            const $ = cheerio.load(html)
            if($('label[for=accessviolation]').text()) {
                console.log($('label[for=accessviolation]').text().trim())
                banned = true;
                break
            }
            const message = $('body > div.main-content-sec.pb40 > form > div > div.container > div > div > div.col-lg-12.appointment-sec.center > div.rows.text-center > h1').text()
            msgs.push(message)

        }

        for(let i=0; i<msgs.length; i++) {
            if(!!msgs[i]) {
                validMsgs[ids[i]] = msgs[i]
            } else {
                invalidIds.push(ids[i])
            }
        }
        if(Object.keys(validMsgs).length) {
            writeMessages(validMsgs)
            
        }
        if(invalidIds.length) {
            writeInvalidKeys(invalidIds)
        }
        

    }
})()





// for(let id of idIterator) {
//     q.push({id}, function(err) {
//         console.log()
//     })
// }

// do{
//     let currentIt = idIterator.next()
//     let counter = 0
    
//     while(counter < 10 && !currentIt.done) {

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