import { allocUnsafe, encodeUtf8Into, getUtf8Length } from '@atcute/uint8array';

/** a fixed-capacity byte writer. */
export class ByteWriter {
	#bytes: Uint8Array<ArrayBuffer>;
	#view: DataView;
	#offset = 0;

	/** @param capacity upper bound on the bytes that will be written */
	constructor(capacity: number) {
		this.#bytes = allocUnsafe(capacity);
		this.#view = new DataView(this.#bytes.buffer);
	}

	/** current write offset. */
	get length() {
		return this.#offset;
	}

	#claim(size: number) {
		const at = this.#offset;
		const end = at + size;

		if (end > this.#bytes.length) {
			throw new RangeError(`byte writer overflow: ${end} exceeds a capacity of ${this.#bytes.length}`);
		}

		this.#offset = end;
		return at;
	}

	u8(value: number) {
		const at = this.#claim(1);

		this.#view.setUint8(at, value);
	}

	u16(value: number) {
		const at = this.#claim(2);

		this.#view.setUint16(at, value);
	}

	u32(value: number) {
		const at = this.#claim(4);

		this.#view.setUint32(at, value);
	}

	u64(value: number) {
		const at = this.#claim(8);

		this.#view.setBigUint64(at, BigInt(value));
	}

	zeros(length: number) {
		const at = this.#claim(length);

		this.#bytes.fill(0, at, at + length);
	}

	text(value: string) {
		const at = this.#claim(getUtf8Length(value));

		encodeUtf8Into(this.#bytes, value, at);
	}

	bytes(data: Uint8Array) {
		const at = this.#claim(data.byteLength);

		this.#bytes.set(data, at);
	}

	patchU32(at: number, value: number) {
		this.#view.setUint32(at, value);
	}

	/** @returns written bytes */
	take(): Uint8Array<ArrayBuffer> {
		const written = this.#bytes.subarray(0, this.#offset);

		this.#bytes = allocUnsafe(0);
		this.#view = new DataView(this.#bytes.buffer);
		this.#offset = 0;

		return written;
	}
}
