import { StreamTarget, type StreamTargetChunk } from 'mediabunny';

const CHUNK_SIZE = 8 * 1024 * 1024;

export type BlobTarget = {
	target: StreamTarget;
	/** @returns bytes written so far; complete only after output finalization */
	read: () => Blob;
};

/**
 * creates an output target backed by a `Blob`.
 *
 * @param mimeType output MIME type
 * @returns a target and a reader for its output
 */
export function createBlobTarget(mimeType: string): BlobTarget {
	// blobs let the browser manage storage without a full output buffer on the JS heap.
	let blob = new Blob([], { type: mimeType });

	const writable = new WritableStream<StreamTargetChunk>({
		write: ({ data, position }) => {
			if (position >= blob.size) {
				// muxers may leave gaps for metadata written later.
				const gap = position - blob.size;
				blob = new Blob(gap > 0 ? [blob, new Uint8Array(gap), data] : [blob, data], { type: mimeType });
				return;
			}

			// muxers may patch earlier bytes, such as box sizes, after writing their contents.
			const end = position + data.byteLength;
			const parts: BlobPart[] = [blob.slice(0, position), data];
			if (end < blob.size) {
				parts.push(blob.slice(end));
			}
			blob = new Blob(parts, { type: mimeType });
		},
	});

	return {
		target: new StreamTarget(writable, { chunked: true, chunkSize: CHUNK_SIZE }),
		read: () => blob,
	};
}
