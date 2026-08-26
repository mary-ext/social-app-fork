import { useState } from 'react';

import type { Handle } from '@atcute/lexicons';

import { MAX_POST_LINES } from '#/lib/constants/post';
import type { Richtext } from '#/lib/rich-text';
import { countLines } from '#/lib/utils/text';

import type { PostNumbering } from '#/state/queries/feed-tuner';

import { PostNumber } from '#/components/PostNumber';
import { RichText } from '#/components/RichText';

import { m } from '#/paraglide/messages';

import * as css from './ClampedPostText.css';

/** post rich text that clamps to {@link MAX_POST_LINES} and reveals the rest behind a show-more button */
export function ClampedPostText({
	authorHandle,
	postNumbering,
	richText,
}: {
	authorHandle: Handle;
	postNumbering?: PostNumbering;
	richText: Richtext;
}) {
	const [limitLines, setLimitLines] = useState(() => countLines(richText.text) >= MAX_POST_LINES);

	// a flex wrapper around RichText for spacing, not a text leaf — the *Text-returns-<Text> rule doesn't apply
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return (
		<div className={css.richText}>
			<RichText
				authorHandle={authorHandle}
				enableTags
				numberOfLines={limitLines ? MAX_POST_LINES : undefined}
				size="md"
				suffix={!limitLines && postNumbering ? <PostNumber value={postNumbering} /> : undefined}
				value={richText}
			/>
			{limitLines && (
				<div className={css.showMoreRow}>
					<button
						type="button"
						className={css.showMore}
						aria-label={m['components.post.text.expand']()}
						onClick={() => setLimitLines(false)}
					>
						{m['components.post.text.showMore']()}
					</button>
					{postNumbering && <PostNumber value={postNumbering} />}
				</div>
			)}
		</div>
	);
}
