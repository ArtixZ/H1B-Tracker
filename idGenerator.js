const prefix = 'EAC191';

const exampleSurfix = '6652149';

const rangeDigits = 3;

function* idGenerator(start = 0) {
	if (typeof start == 'string') {
		start = Number(start.slice(start.length - exampleSurfix.length));
	}

	let idx = start,
		skipTo = 0;

	while (idx < Number('1' + '0'.repeat(exampleSurfix.length))) {
		const str = String(idx).padStart(exampleSurfix.length, '0');

		skipTo = yield {
			stringID: prefix + str,
            range: str.slice(0, rangeDigits),
            percentInRange: idx%(Number("1".padEnd(exampleSurfix.length - rangeDigits + 1)))/Number("1".padEnd(exampleSurfix.length - rangeDigits + 1)),
			nextRangeStarts: prefix + String(Number(str.slice(0, rangeDigits)) + 1).padStart(rangeDigits, '0').padEnd(exampleSurfix.length, '0')
		};

		if (typeof skipTo == 'string') {
			skipTo = skipTo ? Number(skipTo.slice(skipTo.length - exampleSurfix.length)) : 0;
		}

		idx = skipTo || idx + 1;
	}
}

function *idGenerator2(start = 0) {
	if (typeof start == 'string') {
		start = Number(start.slice(start.length - exampleSurfix.length));
	}

	let idx = start,
		skipTo = 0;

	while (idx < Number('1' + '0'.repeat(rangeDigits))) {
		const str1 = String(idx).padStart(rangeDigits, '0');

		skipTo = yield function *subIdGenerator() {
            for(let i = 0; i<Number('1' + '0'.repeat(exampleSurfix.length - rangeDigits)); i++) {
                console.log()
                const str2 = String(i).padStart('0')
                yield (str1 + str2)
            }
        }

		// if (typeof skipTo == 'string') {
		// 	skipTo = skipTo ? Number(skipTo.slice(skipTo.length - exampleSurfix.length)) : 0;
		// }

		idx = skipTo || idx + 1;
	}
}

module.exports = idGenerator;
