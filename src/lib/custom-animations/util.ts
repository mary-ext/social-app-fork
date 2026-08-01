// roll at direction changes, count boundaries, and while the count is below 1000.
export function decideShouldRoll(isSet: boolean, count: number) {
	let shouldRoll = false;
	if (!isSet && count === 1) {
		shouldRoll = true;
	} else if (count > 1 && count < 1000) {
		shouldRoll = true;
	} else if (count > 0) {
		const mod = count % 100;
		if (isSet && mod === 0) {
			shouldRoll = true;
		} else if (!isSet && mod === 99) {
			shouldRoll = true;
		}
	}
	return shouldRoll;
}
