import { useState } from 'react';

import { MAX_POST_LINES } from '#/lib/constants';
import { countLines } from '#/lib/strings/helpers';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { RichText } from '#/components/RichText';

import { m } from '#/paraglide/messages';

import * as css from './ClampedPostText.css';

/** post rich text that clamps to {@link MAX_POST_LINES} and reveals the rest behind a show-more button */
export function ClampedPostText({ authorHandle, richText }: { authorHandle: string; richText: Richtext }) {
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
				value={richText}
			/>
			{limitLines && (
				<button
					type="button"
					className={css.showMore}
					aria-label={m['components.post.text.expand']()}
					onClick={() => setLimitLines(false)}
				>
					{/* the button hosts the link text directly, so the *Text-returns-<Text> rule doesn't apply */}
					{}
					{m['components.post.text.showMore']()}
				</button>
			)}
		</div>
	);
}
