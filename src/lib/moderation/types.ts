import type { ModerationCause } from '@atcute/bluesky-moderation';

export type AppModerationCause =
	| ModerationCause
	| {
			type: 'reply-hidden';
			source: { type: 'user'; did: string };
			priority: 6;
			downgraded?: boolean;
	  };
