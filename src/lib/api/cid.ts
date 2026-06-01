import { encode } from '@atcute/cbor';
import * as CID from '@atcute/cid';

/**
 * Computes the CIDv1 (DAG-CBOR, SHA-256) of a repo record, matching what the PDS derives on write.
 *
 * The record must carry its `$type`: the CID is computed over the DAG-CBOR encoding with the field present,
 * even though the PDS accepts record writes without it. `@atcute/cbor` natively encodes blob refs, CID links,
 * and bytes, and drops `undefined` values.
 *
 * @param record the record to hash, including its `$type`.
 * @returns the base32 CIDv1 string.
 */
export const serializeRecordCid = async (record: { $type: string }): Promise<string> => {
	const bytes = encode(record);
	const cid = await CID.create(0x71, bytes);
	return CID.toString(cid);
};
