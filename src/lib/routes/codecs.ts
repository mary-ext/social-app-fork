import {
	type ActorIdentifier,
	isActorIdentifier,
	isRecordKey,
	type RecordKey,
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
