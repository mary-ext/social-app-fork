import { type AppBskyActorDefs, type ChatBskyActorDefs } from '@atcute/bluesky';

/** Matches any profile view exported by the bluesky lexicons. */
export type AnyProfileView =
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewDetailed
	| ChatBskyActorDefs.ProfileViewBasic;
