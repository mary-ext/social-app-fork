import { useEffect, useRef } from 'react';
import { type ScrollView, View } from 'react-native';

import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { HITSLOP_10 } from '#/lib/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import { DraggableScrollView } from '#/components/DraggableScrollView';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

type Props = {
	testID?: string;
	profiles: AnyProfileView[];
	onRemove?: (did: string) => void;
};

export function ChatProfileTabs({ testID, profiles, onRemove }: Props) {
	const t = useTheme();
	const scrollElRef = useRef<ScrollView | null>(null);

	useEffect(() => {
		requestAnimationFrame(() => {
			// Scroll to the end of the list when `profiles` changes.
			scrollElRef.current?.scrollToEnd({ animated: true });
		});
	}, [profiles, scrollElRef]);

	return (
		<View testID={testID} accessibilityRole="list" style={[t.atoms.bg]}>
			<DraggableScrollView
				ref={scrollElRef}
				testID={`${testID}-selector`}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				<View style={[a.flex_row, a.flex_grow, a.gap_sm, a.align_center, a.justify_start]}>
					{profiles.map((profile, index) => (
						<Tab
							key={profile.did}
							testID={testID}
							index={index}
							profile={profile}
							total={profiles.length}
							onRemove={onRemove}
						/>
					))}
				</View>
			</DraggableScrollView>
		</View>
	);
}

function Tab({
	testID,
	index,
	profile,
	total,
	onRemove,
}: {
	testID?: string;
	index: number;
	profile: AnyProfileView;
	total: number;
	onRemove?: (did: string) => void;
}) {
	const t = useTheme();
	const moderationOpts = useModerationOpts();

	const moderation = moderateProfile(profile, moderationOpts!);
	const displayName = sanitizeDisplayName(
		profile.displayName || profile.handle,
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	const onPressItem = (did: string) => {
		onRemove?.(did);
	};

	return (
		<View
			testID={`${testID}-selector-${profile.did}`}
			style={[
				a.flex_row,
				a.align_center,
				a.border,
				a.justify_center,
				a.rounded_lg,
				a.pl_xs,
				a.pr_sm,
				a.py_xs,
				t.atoms.border_contrast_low,
				t.atoms.bg,
				index === 0 ? a.ml_lg : index === total - 1 ? a.mr_lg : null,
			]}
		>
			{moderationOpts ? (
				<>
					<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} size={24} disabledPreview />
					<View style={[a.flex_row, a.align_center, a.max_w_full, a.ml_xs]}>
						<Text
							emoji
							style={[a.text_sm, a.font_normal, a.leading_snug, a.self_start, a.flex_shrink, t.atoms.text]}
							numberOfLines={1}
						>
							{displayName}
						</Text>
					</View>
				</>
			) : (
				<>
					<ProfileCard.AvatarPlaceholder size={24} />
					<ProfileCard.NamePlaceholder />
				</>
			)}
			<Button
				hitSlop={HITSLOP_10}
				label={m['components.dms.group.action.removeMember']({ name: displayName })}
				style={[a.ml_xs]}
				onPress={() => onPressItem(profile.did)}
			>
				{({ hovered, pressed, focused }) => (
					<XIcon size="sm" fill={hovered || pressed || focused ? colors.text : colors.textContrastHigh} />
				)}
			</Button>
		</View>
	);
}
