import { type AppBskyActorDefs } from '@atcute/bluesky';
import { type ChatBskyActorDefs } from '@atproto/api';

/**
 * Matches any profile view exported by the bluesky lexicons.
 *
 * The `app.bsky.*` variants come from `@atcute/bluesky` (Phase 2.2). The `chat.bsky.*` variant stays on
 * `@atproto/api` until the chat hub migrates in Phase 4.1.
 */
export type AnyProfileView =
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewDetailed
	| ChatBskyActorDefs.ProfileViewBasic;
