export function choose<U, T extends Record<string, U>>(value: keyof T, choices: T): U {
	return choices[value];
}

/**
 * returns `a` if `b` is deeply equal, preserving structural sharing between `a` and `b`. supports Date object
 * comparisons.
 *
 * @param a the first value to compare
 * @param b the second value to compare
 * @returns the structurally shared result
 */
type PlainObject = Record<string, unknown>;

export function replaceEqualDeep<T>(a: T, b: T): T;
export function replaceEqualDeep(a: unknown, b: unknown): unknown;
export function replaceEqualDeep(a: unknown, b: unknown): unknown {
	if (a === b) {
		return a;
	}

	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime() ? a : b;
	}

	if (isPlainArray(a) && isPlainArray(b)) {
		const aItems = a;
		const aSize = aItems.length;
		const bItems = b;
		const bSize = bItems.length;
		const copy: unknown[] = [];

		let equalItems = 0;

		for (let i = 0; i < bSize; i++) {
			copy[i] = replaceEqualDeep(a[i], b[i]);
			if (copy[i] === a[i] && a[i] !== undefined) {
				equalItems++;
			}
		}

		return aSize === bSize && equalItems === aSize ? a : copy;
	}

	if (isPlainObject(a) && isPlainObject(b)) {
		const aItems = Object.keys(a);
		const aSize = aItems.length;
		const bItems = Object.keys(b);
		const bSize = bItems.length;
		const copy: PlainObject = {};

		let equalItems = 0;

		for (let i = 0; i < bSize; i++) {
			const key = bItems[i]!;
			if (a[key] === undefined && b[key] === undefined && aItems.includes(key)) {
				copy[key] = undefined;
				equalItems++;
			} else {
				copy[key] = replaceEqualDeep(a[key], b[key]);
				if (copy[key] === a[key] && a[key] !== undefined) {
					equalItems++;
				}
			}
		}

		return aSize === bSize && equalItems === aSize ? a : copy;
	}

	return b;
}

export function isPlainArray(value: unknown): value is unknown[] {
	return Array.isArray(value) && value.length === Object.keys(value).length;
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o: unknown): o is PlainObject {
	if (!hasObjectPrototype(o)) {
		return false;
	}

	// If has no constructor
	const ctor = o.constructor;
	if (ctor === undefined) {
		return true;
	}

	// If has modified prototype
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) {
		return false;
	}

	// If constructor does not have an Object-specific method
	if (!prot.hasOwnProperty('isPrototypeOf')) {
		return false;
	}

	// Most likely a plain Object
	return true;
}

function hasObjectPrototype(o: unknown): o is PlainObject {
	return Object.prototype.toString.call(o) === '[object Object]';
}
