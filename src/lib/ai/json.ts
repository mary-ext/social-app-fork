/**
 * extracts the first complete JSON object from a model reply.
 *
 * @param reply the model's raw reply
 * @returns the JSON source, or `undefined` if no complete object exists
 */
export const extractJsonObject = (reply: string): string | undefined => {
	const start = reply.indexOf('{');
	if (start === -1) {
		return undefined;
	}

	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let idx = start; idx < reply.length; idx++) {
		const char = reply[idx];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (inString) {
			switch (char) {
				case '"': {
					inString = false;
					break;
				}
				case '\\': {
					escaped = true;
					break;
				}
			}
			continue;
		}

		switch (char) {
			case '"': {
				inString = true;
				break;
			}
			case '{': {
				depth++;
				break;
			}
			case '}': {
				if (--depth === 0) {
					return reply.slice(start, idx + 1);
				}
				break;
			}
		}
	}

	return undefined;
};
