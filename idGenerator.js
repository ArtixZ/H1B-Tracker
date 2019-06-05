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
			percentInRange:
				(idx % Number('1'.padEnd(exampleSurfix.length - rangeDigits + 1))) /
				Number('1'.padEnd(exampleSurfix.length - rangeDigits + 1)),
			nextRangeStarts:
				prefix +
				String(Number(str.slice(0, rangeDigits)) + 1)
					.padStart(rangeDigits, '0')
					.padEnd(exampleSurfix.length, '0')
		};

		if (typeof skipTo == 'string') {
			skipTo = skipTo ? Number(skipTo.slice(skipTo.length - exampleSurfix.length)) : 0;
		}

		idx = skipTo || idx + 1;
	}
}

function* idGenerator2(start = 0) {
	// if (typeof start == 'string') {
	// 	idx2.splice(0, prefix.length)
	// }
	let idx1 = 0,
		idx2 = 0,
		skipTo;

	if (start) {
		(idx1 = Number(start.slice(prefix.length, prefix.length + rangeDigits))),
			(idx2 = Number(start.slice(prefix.length + rangeDigits))),
			(skipTo = 0);
	}
	const range1 = Number('1' + '0'.repeat(rangeDigits)),
		range2 = Number('1' + '0'.repeat(exampleSurfix.length - rangeDigits));

	while (idx1 < range1) {
		const str1 = String(idx1).padStart(rangeDigits, '0');

		skipTo = yield function* subIdGenerator() {
			while (idx2 < range2) {
				const str2 = String(idx2).padStart(exampleSurfix.length - rangeDigits, '0');
				yield { stringID: prefix + str1 + str2, percentage: idx2 / range2 };
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
