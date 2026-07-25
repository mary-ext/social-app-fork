import {
	type ActorIdentifier,
	isActorIdentifier,
	isRecordKey,
	isResourceUri,
	isTid,
	type RecordKey,
	type ResourceUri,
	type Tid,
} from '@atcute/lexicons/syntax';

import type { Codec } from '@oomfware/stacker';

// the codecs are stateless and immutable, so a single shared instance backs every route definition.

const ACTOR_IDENTIFIER_CODEC: Codec<ActorIdentifier> = {
	decode: (raw) => (isActorIdentifier(raw) ? raw : undefined),
	encode: (value) => value,
};

const RECORD_KEY_CODEC: Codec<RecordKey> = {
	decode: (raw) => (isRecordKey(raw) ? raw : undefined),
	encode: (value) => value,
};

const RESOURCE_URI_CODEC: Codec<ResourceUri> = {
	decode: (raw) => (isResourceUri(raw) ? raw : undefined),
	encode: (value) => value,
};

const TID_CODEC: Codec<Tid> = {
	decode: (raw) => (isTid(raw) ? raw : undefined),
	encode: (value) => value,
};

/**
 * returns a codec for an {@link ActorIdentifier} path segment, i.e. a did or handle. an invalid segment fails
 * to decode, causing the matcher to skip the route.
 *
 * @returns the actor identifier codec
 */
export const actorIdentifier = (): Codec<ActorIdentifier> => ACTOR_IDENTIFIER_CODEC;

/**
 * returns a codec for a {@link RecordKey} path segment. an invalid segment fails to decode, causing the
 * matcher to skip the route.
 *
 * @returns the record key codec
 */
export const recordKey = (): Codec<RecordKey> => RECORD_KEY_CODEC;

/**
 * returns a codec for a {@link ResourceUri} segment, i.e. an at-uri. an invalid segment fails to decode,
 * causing the matcher to skip the route.
 *
 * @returns the resource uri codec
 */
export const resourceUri = (): Codec<ResourceUri> => RESOURCE_URI_CODEC;
/**
 * returns a codec for a {@link Tid} path segment. an invalid segment fails to decode, causing the matcher to
 * skip the route.
 *
 * @returns the tid codec
 */
export const tid = (): Codec<Tid> => TID_CODEC;
