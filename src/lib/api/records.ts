import type { ComAtprotoRepoGetRecord, ComAtprotoRepoListRecords } from '@atcute/atproto';
import { type Client, ok } from '@atcute/client';
import type { Cid, Did, InferInput, ResourceUri } from '@atcute/lexicons';
import type { Records } from '@atcute/lexicons/ambient';

/**
 * Typed `com.atproto.repo.*` record helpers.
 *
 * `@atcute/client`'s generic `get`/`post` type `getRecord`'s `value` and `putRecord`'s `record` as `unknown`.
 * These helpers re-type them via the ambient `Records` map so each call infers its record value from the
 * `collection` NSID, and centralize the casts the `repo.*` wire shape needs.
 */

/** An NSID for which a record type is registered in the ambient `Records` map. */
type RecordType = keyof Records;

export interface CreateRecordOptions<K extends RecordType> {
	collection: K;
	record: InferInput<Records[K]>;
	repo: Did;
	rkey?: string;
	swapCommit?: string;
	validate?: boolean;
}

/**
 * Creates a repo record via `com.atproto.repo.createRecord`.
 *
 * @param client the client to issue the call on — the `pds` client for own-repo writes.
 * @param options the record to create.
 * @returns the create-record response.
 */
export const createRecord = async <K extends RecordType>(client: Client, options: CreateRecordOptions<K>) => {
	return await ok(client.post('com.atproto.repo.createRecord', { input: options }));
};

export interface PutRecordOptions<K extends RecordType> {
	collection: K;
	record: InferInput<Records[K]>;
	repo: Did;
	rkey: string;
	swapCommit?: string;
	swapRecord?: Cid | null;
	validate?: boolean;
}

/**
 * Writes a repo record at a known rkey via `com.atproto.repo.putRecord`.
 *
 * @param client the client to issue the call on — the `pds` client for own-repo writes.
 * @param options the record to write.
 * @returns the put-record response.
 */
export const putRecord = async <K extends RecordType>(client: Client, options: PutRecordOptions<K>) => {
	return await ok(client.post('com.atproto.repo.putRecord', { input: options }));
};

export interface DeleteRecordOptions<K extends RecordType> {
	collection: K;
	repo: Did;
	rkey: string;
	swapCommit?: string;
	swapRecord?: string;
}

/**
 * Deletes a repo record via `com.atproto.repo.deleteRecord`.
 *
 * @param client the client to issue the call on — the `pds` client for own-repo writes.
 * @param options the record to delete.
 */
export const deleteRecord = async <K extends RecordType>(client: Client, options: DeleteRecordOptions<K>) => {
	await ok(client.post('com.atproto.repo.deleteRecord', { input: options }));
};

export interface GetRecordOptions<K extends RecordType> {
	cid?: string;
	collection: K;
	repo: Did;
	rkey: string;
	signal?: AbortSignal;
}

export type GetRecordOutput<T> = ComAtprotoRepoGetRecord.$output & { value: T };

/**
 * Reads a single repo record via `com.atproto.repo.getRecord`, typed by its `collection`.
 *
 * @param client the client to issue the call on — `appview` for another user's record, `pds` for own.
 * @param options the record to read.
 * @returns the record output, with `value` typed from the `collection`.
 */
export const getRecord = async <K extends RecordType>(
	client: Client,
	options: GetRecordOptions<K>,
): Promise<GetRecordOutput<InferInput<Records[K]>>> => {
	const data = await ok(
		client.get('com.atproto.repo.getRecord', {
			signal: options.signal,
			params: {
				cid: options.cid,
				collection: options.collection,
				repo: options.repo,
				rkey: options.rkey,
			},
		}),
	);

	return data as unknown as GetRecordOutput<InferInput<Records[K]>>;
};

export interface ListRecordsOptions<K extends RecordType> {
	collection: K;
	cursor?: string;
	limit?: number;
	repo: Did;
	signal?: AbortSignal;
}

export type ListRecordsOutput<T> = Omit<ComAtprotoRepoListRecords.$output, 'records'> & {
	cursor?: string;
	records: { cid: Cid; uri: ResourceUri; value: T }[];
};

/**
 * Lists repo records via `com.atproto.repo.listRecords`, typed by their `collection`.
 *
 * @param client the client to issue the call on — `appview` for another user's records, `pds` for own.
 * @param options the records to list.
 * @returns the list output, with each record's `value` typed from the `collection`.
 */
export const listRecords = async <K extends RecordType>(
	client: Client,
	options: ListRecordsOptions<K>,
): Promise<ListRecordsOutput<InferInput<Records[K]>>> => {
	const data = await ok(
		client.get('com.atproto.repo.listRecords', {
			signal: options.signal,
			params: {
				collection: options.collection,
				cursor: options.cursor,
				limit: options.limit,
				repo: options.repo,
			},
		}),
	);

	return data as unknown as ListRecordsOutput<InferInput<Records[K]>>;
};
