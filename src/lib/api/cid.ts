import { encode } from '@atcute/cbor';
import * as CID from '@atcute/cid';

/**
 * computes the CIDv1 (DAG-CBOR, SHA-256) of a repo record, matching what the PDS derives on write.
 *
 * @param record record to hash, including its `$type`
 * @returns base32 CIDv1 string
 */
export const serializeRecordCid = async (record: { $type: string }): Promise<string> => {
	const bytes = encode(record);
	const cid = await CID.create(0x71, bytes);
	return CID.toString(cid);
};
