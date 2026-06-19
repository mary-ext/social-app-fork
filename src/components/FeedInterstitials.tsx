import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import type { FeedDescriptor } from '#/state/queries/post-feed';
import { useSuggestedFollowsByActorWithDismiss } from '#/state/queries/suggested-follows';
import { useGetSuggestedUsersForDiscoverQuery } from '#/state/queries/trending/useGetSuggestedUsersForDiscoverQuery';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useBreakpoints, useTheme, type ViewStyleProp } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRight } from '#/components/icons/Arrow';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import * as ProfileCard from '#/components/ProfileCard';
import { SuggestedFollowsDialog } from '#/components/suggested-follows-dialog';
import { Text } from '#/components/Typography';

const MOBILE_CARD_WIDTH = 165;
const FINAL_CARD_WIDTH = 120;

type WebViewStyle = Omit<ViewStyle, 'width'> & {
	width?: string;
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style as unknown as ViewStyle;
};

function CardOuter({ children, style }: { children: React.ReactNode | React.ReactNode[] } & ViewStyleProp) {
	const t = useTheme();
	const { gtMobile } = useBreakpoints();
	return (
		<View
			testID="CardOuter"
			style={[
				a.flex_1,
				a.w_full,
				a.p_md,
				a.rounded_lg,
				a.border,
				t.atoms.bg,
				t.atoms.shadow_sm,
				t.atoms.border_contrast_low,
				!gtMobile && {
					width: MOBILE_CARD_WIDTH,
				},
				style,
			]}
		>
			{children}
		</View>
	);
}

export function SuggestedFollowPlaceholder() {
	return (
		<CardOuter>
			<ProfileCard.Outer>
				<View style={[a.flex_col, a.align_center, a.gap_sm, a.pb_sm, a.mb_auto]}>
					<ProfileCard.AvatarPlaceholder size={88} />
					<ProfileCard.NamePlaceholder />
					<View style={[a.w_full]}>
						<ProfileCard.DescriptionPlaceholder numberOfLines={2} />
					</View>
				</View>

				<ProfileCard.FollowButtonPlaceholder />
			</ProfileCard.Outer>
		</CardOuter>
	);
}

export function SuggestedFollows({ feed }: { feed: FeedDescriptor }) {
	const { currentAccount } = useSession();
	const [feedType, feedUriOrDid] = feed.split('|') as [string, string];
	if (feedType === 'author') {
		if (currentAccount?.did === feedUriOrDid) {
			return null;
		} else {
			return <SuggestedFollowsProfile did={feedUriOrDid} />;
		}
	} else {
		return <SuggestedFollowsHome />;
	}
}

export function SuggestedFollowsProfile({ did }: { did: string }) {
	const { profiles, recId, onDismiss, isLoading, error } = useSuggestedFollowsByActorWithDismiss({ did });

	return (
		<ProfileGrid
			isSuggestionsLoading={isLoading}
			profiles={profiles}
			recId={recId}
			error={error}
			viewContext="profile"
			onDismiss={onDismiss}
		/>
	);
}

export function SuggestedFollowsHome() {
	const { isLoading, data, error } = useGetSuggestedUsersForDiscoverQuery();

	const profiles = data?.actors;

	const [dismissedDids, setDismissedDids] = useState<Set<string>>(new Set());

	const onDismiss = useCallback((did: string) => {
		setDismissedDids((prev) => new Set(prev).add(did));
	}, []);

	const allProfiles = useMemo(() => {
		const result: Array<{
			actor: AnyProfileView;
			recId?: string;
		}> = [];

		for (const profile of profiles ?? []) {
			result.push({ actor: profile, recId: data?.recId });
		}

		return result;
	}, [data?.recId, profiles]);

	const filteredProfiles = useMemo(() => {
		return allProfiles.filter((p) => !dismissedDids.has(p.actor.did));
	}, [allProfiles, dismissedDids]);

	return (
		<ProfileGrid
			recId={data?.recId}
			isSuggestionsLoading={isLoading}
			profiles={filteredProfiles}
			totalProfileCount={allProfiles.length}
			error={error}
			viewContext="feed"
			onDismiss={onDismiss}
		/>
	);
}

export function ProfileGrid({
	isSuggestionsLoading,
	error,
	profiles,
	recId: _recId,
	totalProfileCount,
	viewContext = 'feed',
	onDismiss,
	onRequestHide,
}: {
	isSuggestionsLoading: boolean;
	profiles: { actor: AnyProfileView; recId?: string }[];
	recId?: string;
	totalProfileCount?: number;
	error: Error | null;
	viewContext: 'profile' | 'profileHeader' | 'feed';
	onDismiss?: (did: string) => void;
	onRequestHide?: () => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const moderationOpts = useModerationOpts();
	const { gtMobile } = useBreakpoints();
	const followDialogControl = useDialogControl();

	const isLoading = isSuggestionsLoading || !moderationOpts;
	const isProfileHeaderContext = viewContext === 'profileHeader';

	const maxLength = gtMobile ? 3 : isProfileHeaderContext ? 12 : 6;
	const minLength = gtMobile ? 3 : 4;

	const content = isLoading
		? Array(maxLength)
				.fill(0)
				.map((_, i) => (
					<View
						key={i}
						style={[
							a.flex_1,
							gtMobile && [
								a.flex_0,
								a.flex_grow,
								webViewStyle({ width: `calc(30% - ${a.gap_md.gap / 2}px)` }),
							],
						]}
					>
						<SuggestedFollowPlaceholder />
					</View>
				))
		: error || !profiles.length
			? null
			: profiles.slice(0, maxLength).map((profile, _index) => (
					<View
						key={profile.actor.did}
						style={[
							a.flex_1,
							gtMobile && [
								a.flex_0,
								a.flex_grow,
								webViewStyle({ width: `calc(30% - ${a.gap_md.gap / 2}px)` }),
							],
						]}
					>
						<ProfileCard.Link profile={profile.actor} onPress={() => {}} style={[a.flex_1]}>
							{({ hovered, pressed }) => (
								<CardOuter style={[(hovered || pressed) && t.atoms.border_contrast_high]}>
									<ProfileCard.Outer>
										{onDismiss && (
											<Button
												label={l`Dismiss this suggestion`}
												onPress={(e) => {
													e.preventDefault();
													onDismiss(profile.actor.did);
												}}
												style={[a.absolute, a.z_10, a.p_xs, { top: -4, right: -4 }]}
											>
												{({ hovered: dismissHovered, pressed: dismissPressed }) => (
													<X
														size="xs"
														fill={
															dismissHovered || dismissPressed
																? t.atoms.text.color
																: t.atoms.text_contrast_medium.color
														}
													/>
												)}
											</Button>
										)}
										<View style={[a.flex_col, a.align_center, a.gap_sm, a.pb_sm, a.mb_auto]}>
											<ProfileCard.Avatar
												profile={profile.actor}
												moderationOpts={moderationOpts}
												disabledPreview
												size={88}
											/>
											<View style={[a.flex_col, a.align_center, a.max_w_full]}>
												<ProfileCard.Name profile={profile.actor} moderationOpts={moderationOpts} />
												<ProfileCard.Description
													profile={profile.actor}
													align="center"
													color="textContrastMedium"
													numberOfLines={2}
													size="xs"
												/>
											</View>
										</View>

										<ProfileCard.FollowButton
											profile={profile.actor}
											moderationOpts={moderationOpts}
											withIcon={false}
											style={[a.rounded_sm]}
											onFollow={() => {}}
										/>
									</ProfileCard.Outer>
								</CardOuter>
							)}
						</ProfileCard.Link>
					</View>
				));

	// Use totalProfileCount (before dismissals) for minLength check on initial render.
	const profileCountForMinCheck = totalProfileCount ?? profiles.length;

	useEffect(() => {
		if (error || (!isLoading && profileCountForMinCheck < minLength)) {
			onRequestHide?.();
		}
	}, [error, isLoading, onRequestHide, profileCountForMinCheck, minLength]);

	if (error || (!isLoading && profileCountForMinCheck < minLength)) {
		logger.debug(`Not enough profiles to show suggested follows`);
		return null;
	}

	return (
		<View
			style={[!isProfileHeaderContext && a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}
			pointerEvents={'box-none'}
		>
			<View
				style={[a.px_lg, a.pt_md, a.flex_row, a.align_center, a.justify_between]}
				pointerEvents={'box-none'}
			>
				<Text style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
					<Trans>Suggested for you</Trans>
				</Text>
				<Button
					label={l`See more suggested profiles`}
					onPress={() => {
						followDialogControl.open();
					}}
				>
					{({ hovered }) => (
						<Text
							style={[
								a.text_sm,
								{ color: t.palette.primary_500 },
								hovered && {
									textDecorationLine: 'underline',
									textDecorationColor: t.palette.primary_500,
								},
							]}
						>
							<Trans>See more</Trans>
						</Text>
					)}
				</Button>
			</View>
			<SuggestedFollowsDialog control={followDialogControl} />
			{gtMobile ? (
				<View style={[a.p_lg, a.pt_md]}>
					<View style={[a.flex_1, a.flex_row, a.flex_wrap, a.gap_md]}>{content}</View>
				</View>
			) : (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={[a.p_lg, a.pt_md, a.flex_row, a.gap_md]}
					snapToInterval={MOBILE_CARD_WIDTH + a.gap_md.gap}
					decelerationRate="fast"
				>
					{content}

					<SeeMoreSuggestedProfilesCard
						onPress={() => {
							followDialogControl.open();
						}}
					/>
				</ScrollView>
			)}
		</View>
	);
}

function SeeMoreSuggestedProfilesCard({ onPress }: { onPress: () => void }) {
	const { t: l } = useLingui();

	return (
		<Button
			label={l`Browse more accounts`}
			onPress={onPress}
			style={[
				a.flex_col,
				a.align_center,
				a.justify_center,
				a.gap_sm,
				a.p_md,
				a.rounded_lg,
				{ width: FINAL_CARD_WIDTH },
			]}
		>
			<ButtonIcon icon={ArrowRight} size="lg" />
			<ButtonText style={[a.text_md, a.font_medium, a.leading_snug, a.text_center]}>
				<Trans>See more</Trans>
			</ButtonText>
		</Button>
	);
}
