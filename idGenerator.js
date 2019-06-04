
const prefix = "EAC191"

const exampleSurfix = "6652149"

function *idGenerator(start = 0) {
    if(typeof start == 'string') {
        start = Number(start.slice(start.length - exampleSurfix.length))
    }
    
    let idx = start,
    skip = 0

    while(idx < Number("1" + "0".repeat(exampleSurfix.length))) {

        const str = String(idx).padStart(exampleSurfix.length, '0')

        skip = yield (prefix + str)

        if(typeof skip == 'string') {
            skip = skip ? Number(skip.slice(skip.length - exampleSurfix.length)) : 0
        }

        idx = idx + 1 + (skip || 0)
    }
}

module.exports = idGenerator
