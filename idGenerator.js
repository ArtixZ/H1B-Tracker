
const prefix = "EAC191"

const exampleSurfix = "6652149"

function *idGenerator() {
    for(let i = 0; i < Number("1" + "0".repeat(exampleSurfix.length)); i++) {
        const str = String(i).padStart(exampleSurfix.length, '0')
        yield (prefix + str)
    }
}

module.exports = idGenerator