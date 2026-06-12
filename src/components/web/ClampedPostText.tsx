import { useState } from 'react';

import { MAX_POST_LINES } from '#/lib/constants';
import { countLines } from '#/lib/strings/helpers';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { atoms as a } from '#/alf';

import { ShowMoreTextButton } from '#/components/Post/ShowMoreTextButton';
import { RichText } from '#/components/web/RichText';

import * as css from './ClampedPostText.css';

/**
 * Post rich text that clamps to {@link MAX_POST_LINES} when it would overflow, revealing the rest behind a
 * show-more button. Shared by the feed, standalone, and thread post surfaces.
 */
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
			{limitLines && <ShowMoreTextButton style={[a.text_md]} onPress={() => setLimitLines(false)} />}
		</div>
	);
}
