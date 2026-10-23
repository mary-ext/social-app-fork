import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { type PostNumbering, readPostNumbering } from '#/lib/api/post-numbering';

import { FeedViewPostsSlice } from '#/state/queries/feed/lib/feed-slice';

/**
 * a tuning step; receives a copy of the slices and may mutate it.
 *
 * @param tuner the tuner, for cross-page dedupe state
 * @param slices the slices to tune
 * @param dryRun when set, the step must not record anything in the tuner
 * @returns the tuned slices
 */
export type FeedTunerFn = (
	tuner: FeedTuner,
	slices: FeedViewPostsSlice[],
	dryRun: boolean,
) => FeedViewPostsSlice[];

export class FeedTuner {
	seenKeys: Set<string> = new Set();
	seenUris: Set<string> = new Set();
	seenRootUris: Set<string> = new Set();

	constructor(public tunerFns: FeedTunerFn[]) {}

	tune(
		feed: AppBskyFeedDefs.FeedViewPost[],
		{ dryRun }: { dryRun: boolean } = {
			dryRun: false,
		},
	): FeedViewPostsSlice[] {
		// reuse reported numbering when a post appears as an ancestor
		const numberings = feed.map((item) => readPostNumbering(item));
		const postNumberingByUri = new Map<string, PostNumbering>();
		feed.forEach((item, i) => {
			const numbering = numberings[i];
			if (numbering !== undefined) {
				postNumberingByUri.set(item.post.uri, numbering);
			}
		});

		let slices = feed.map((item, i) => new FeedViewPostsSlice(item, numberings[i], postNumberingByUri));

		for (const tunerFn of this.tunerFns) {
			slices = tunerFn(this, slices.slice(), dryRun);
		}

		slices = slices.filter((slice) => {
			if (this.seenKeys.has(slice._reactKey)) {
				return false;
			}
			// dedupe context posts without removing the only visible reply.
			for (let i = 0; i < slice.items.length; i++) {
				const item = slice.items[i]!;
				if (this.seenUris.has(item.post.uri)) {
					if (i === 0) {
						// remove already-seen leading context.
						slice.items.splice(0, 1);
						i--;
					}
					if (i === slice.items.length - 1) {
						// omit a slice whose final item was already shown.
						return false;
					}
				} else {
					if (!dryRun) {
						// keep reposted replies eligible for later context.
						const disableDedupe = slice.isReply && slice.isRepost;
						if (!disableDedupe) {
							this.seenUris.add(item.post.uri);
						}
					}
				}
			}
			if (!dryRun) {
				this.seenKeys.add(slice._reactKey);
			}
			return true;
		});

		return slices;
	}
}
