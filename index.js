const axios = require("axios")
const FormData = require('form-data')
const queue = require('async/queue')

const idIterator = require("./idGenerator")()

const url = "https://egov.uscis.gov/casestatus/mycasestatus.do"

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

let currentIt = idIterator.next();

(async function main() {
    while(!currentIt.done) {
        //  const res = await fetchResult(currentIt.value)
         let reqAry = [],
         counter = 0
    
         while(!currentIt.done && counter<10) {
            reqAry.push(fetchResult(currentIt.value))
            currentIt = idIterator.next()
            counter ++
         }
    
        const res = await Promise.all(reqAry)
        console.log(res)
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

console.log()

// // assign a callback
// q.drain(function() {
//     console.log('all items have been processed');
// });

// // assign an error callback
// q.error(function(err, task) {
//     console.error('task experienced an error');
// });