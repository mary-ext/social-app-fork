import { type GestureResponderEvent, View } from 'react-native';

import { TIMELINE_SAVED_FEED } from '#/lib/constants';

import { useAddSavedFeedsMutation } from '#/state/queries/preferences';

import { Trans } from '#/locale/Trans';

import { atoms as a, useTheme } from '#/alf';

import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function NoFollowingFeed({ onAddFeed }: { onAddFeed?: () => void }) {
	const t = useTheme();
	const { mutateAsync: addSavedFeeds } = useAddSavedFeedsMutation();

	const addRecommendedFeeds = (e: GestureResponderEvent) => {
		e.preventDefault();

		void addSavedFeeds([
			{
				...TIMELINE_SAVED_FEED,
				pinned: true,
			},
		]);

		onAddFeed?.();

		// prevent navigation
		return false as const;
	};

	return (
		<View style={[a.flex_row, a.flex_wrap, a.align_center, a.py_md, a.px_lg]}>
			<Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
				<Trans
					message={m['screens.feeds.empty.missingFollowing']}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText
								to="#"
								label={m['screens.feeds.action.addFollowing']()}
								onPress={addRecommendedFeeds}
								style={[a.leading_snug]}
							>
								{children}
							</InlineLinkText>
						),
					}}
				/>
			</Text>
		</View>
	);
}
