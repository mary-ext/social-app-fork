import type {
	ActorIdentifier,
	CanonicalResourceUri,
	Did,
	Nsid,
	RecordKey,
	ResourceUri,
} from '@atcute/lexicons/syntax';

/**
 * builds the at-uri for a record.
 *
 * @param repo the repo holding the record; a did yields a canonical uri, a handle a resolvable one
 * @param collection the record's collection nsid
 * @param rkey the record key
 * @returns the at-uri
 */
export function makeRecordUri(repo: Did, collection: Nsid, rkey: RecordKey): CanonicalResourceUri;
export function makeRecordUri(repo: ActorIdentifier, collection: Nsid, rkey: RecordKey): ResourceUri;
export function makeRecordUri(repo: ActorIdentifier, collection: Nsid, rkey: RecordKey): ResourceUri {
	return `at://${repo}/${collection}/${rkey}`;
}
