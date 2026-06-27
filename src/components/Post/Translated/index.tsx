import { View } from 'react-native';
import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';

import { HITSLOP_30 } from '#/lib/constants';
import { useGoogleTranslate } from '#/lib/hooks/useGoogleTranslate';

import { useLanguagePrefs } from '#/state/preferences';

import { isPostInLanguage } from '#/locale/helpers';

import { atoms as a, useTheme } from '#/alf';

import { createStaticClick, Link } from '#/components/Link';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function TranslatedPost({ post }: { post: AppBskyFeedDefs.PostView }) {
	const t = useTheme();
	const langPrefs = useLanguagePrefs();
	const translate = useGoogleTranslate();

	const record = post.record as AppBskyFeedPost.Main;
	const needsTranslation = !isPostInLanguage(post, [langPrefs.primaryLanguage]);

	if (!needsTranslation) {
		return null;
	}

	return (
		<View style={[a.mt_sm, a.flex_row, a.align_center, a.gap_xs]}>
			<Link
				role={'link'}
				{...createStaticClick(() => {
					void translate(record?.text || '', langPrefs.primaryLanguage);
				})}
				label={m['common.action.translate']()}
				// @ts-expect-error web-only text decoration cascades to link text
				hoverStyle={[a.underline, { textDecorationColor: t.palette.primary_500 }]}
				hitSlop={HITSLOP_30}
			>
				<Text style={[a.text_sm, { color: t.palette.primary_500 }]}>{m['common.action.translate']()}</Text>
			</Link>
		</View>
	);
}
