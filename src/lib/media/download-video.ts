import type { Did } from '@atcute/lexicons';

import { isAbortError } from '#/lib/errors';
import { downloadUrl } from '#/lib/utils/download';

// the picker requires user activation and can be blocked by document permissions.
const pickSaveFile = async (suggestedName: string) => {
	if (!('showSaveFilePicker' in window)) {
		return;
	}
	try {
		return await showSaveFilePicker({
			id: 'video-download',
			suggestedName,
			types: [{ accept: { 'video/mp4': ['.mp4'] } }],
		});
	} catch (err) {
		if (isAbortError(err)) {
			throw err;
		}
		return;
	}
};

/**
 * downloads a post's original video blob.
 *
 * @param options blob CID, owner DID, and PDS URL
 * @returns whether the File System API wrote the file
 * @throws if reading fails or the user dismisses the file picker
 */
export async function downloadVideo({
	cid,
	did,
	pdsUrl,
}: {
	cid: string;
	did: Did;
	pdsUrl: string;
}): Promise<boolean> {
	const url = new URL('/xrpc/com.atproto.sync.getBlob', pdsUrl);
	url.searchParams.set('did', did);
	url.searchParams.set('cid', cid);

	const filename = `bluesky-${cid}.mp4`;
	const file = await pickSaveFile(filename);

	if (!file) {
		downloadUrl(url.href, filename);
		return false;
	}

	const response = await fetch(url);
	if (!response.ok || !response.body) {
		throw new Error(`getBlob responded ${response.status}`);
	}

	await response.body.pipeTo(await file.createWritable());
	return true;
}
