const prefix = 'EAC191';

const exampleSurfix = '6652149';

const rangeDigits = 3;

const config = require('./configuration');

const { MAX_NUMBER_KEY: maxNumberKey } = config;

function* idGenerator2(start = 0) {
	// if (typeof start == 'string') {
	// 	idx2.splice(0, prefix.length)
	// }
	let idx1 = 0,
		idx2 = 0,
		skipTo;

	if (start && typeof start == 'string') {
		(idx1 = Number(
			start.slice(prefix.length, prefix.length + rangeDigits)
		)), (idx2 = Number(
			start.slice(prefix.length + rangeDigits)
		)), (skipTo = 0);
	} else if (start && typeof start == 'number') {
		const divisor = Number(
			'1' + '0'.repeat(exampleSurfix.length - rangeDigits)
		);
		idx1 = Math.floor(start / divisor);
		idx2 = start % divisor;
		skipTo = 0;
	}
	const validMaxNumberKey = Number(maxNumberKey.slice(prefix.length));
	const range1 = Math.floor(validMaxNumberKey / Number('1' + '0'.repeat(exampleSurfix.length - rangeDigits))),
		range2 = Number('1' + '0'.repeat(exampleSurfix.length - rangeDigits));

	while (idx1 < range1) {
		const str1 = String(idx1).padStart(rangeDigits, '0');

		skipTo = yield function* subIdGenerator() {
			while (idx2 < range2) {
				const str2 = String(idx2).padStart(
					exampleSurfix.length - rangeDigits,
					'0'
				);
				yield {
					stringID: prefix + str1 + str2,
					percentage: idx2 / range2,
					range: str1.padEnd(exampleSurfix.length, 'x')
				};
				idx2++;
			}
		};

		// if (typeof skipTo == 'string') {
		// 	skipTo = skipTo ? Number(skipTo.slice(skipTo.length - exampleSurfix.length)) : 0;
		// }
		idx2 = 0;
		idx1 = skipTo || idx1 + 1;
	}
}

module.exports = idGenerator2;
