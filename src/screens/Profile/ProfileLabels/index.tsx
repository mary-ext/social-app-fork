import { useState } from 'react';

import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { interpretLabelerDefinition, LabelFlags } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { mapDefined, unique } from '@mary/array-fns';

import { MAX_LABELERS } from '#/lib/constants/profile';
import { combinedDisplayName, profileDisplayName } from '#/lib/display-names';
import { cleanError } from '#/lib/errors';
import { isAppLabeler, lookupLabelValueDefinition } from '#/lib/moderation/labelers';
import { profileTarget } from '#/lib/routes/targets';

import { useLabelerInfoQuery, useLabelerSubscriptionMutation } from '#/state/queries/labeler';
import { useLikeMutation, useUnlikeMutation } from '#/state/queries/like';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useTitle } from '#/state/use-title';

import { dateTimeLong } from '#/locale/intl/datetime';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { ErrorScreen } from '#/components/ErrorScreen';
import { useRequireAuth } from '#/components/hooks/use-require-auth';
import * as Menu from '#/components/Menu';
import { LabelerLabelRow } from '#/components/moderation/LabelPreference';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import * as Settings from '#/components/SettingsCards';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText, useInternalLink } from '#/components/web/Link';

import CircleBanSign from '#/icons/central/CircleBanSign_round_outlined_radius1_stroke2.svg';
import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import Ellipsis from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import HeartFilled from '#/icons/central/Heart2_round_filled_radius1_stroke2.svg';
import Heart from '#/icons/central/Heart2_round_outlined_radius1_stroke2.svg';
import UserCircle from '#/icons/central/PeopleCircle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

import * as css from './index.css';

/**
 * a labeler's published label values and the viewer's per-label configuration, split out of the labeler's
 * profile so the profile itself stays an ordinary account page.
 */
export function ProfileLabelsScreen() {
	const [{ actor }] = useParams('ProfileLabels');
	const { data: did, error: resolveError, isPending: isResolvingDid } = useResolveDidQuery(actor);
	const { data: labeler, error: labelerError, isPending: isLabelerPending } = useLabelerInfoQuery({ did });

	// the labeler query stays pending until the did resolves, so a resolve failure has to short-circuit it
	const error = resolveError ?? labelerError;
	const isPending = !error && (isResolvingDid || isLabelerPending);

	useTitle(labeler ? combinedDisplayName(labeler.creator) : m['common.moderation.labels']());

	return (
		<Layout.Screen>
			<Layout.Header.Outer noBottomBorder>
				<Layout.Header.BackButton />
				<Layout.Header.Content />
				<Layout.Header.Slot>{labeler && <LabelerActions labeler={labeler} />}</Layout.Header.Slot>
			</Layout.Header.Outer>
			<Layout.Content>
				{isPending ? (
					<CenteredSpinner label={m['common.status.loading']()} size="_2xl" />
				) : labeler ? (
					<LabelerDetails labeler={labeler} />
				) : (
					// a did that resolves but publishes no service arrives here without an error
					<ErrorScreen
						title={m['screens.profile.labeler.error.serviceLoad']()}
						message={m['screens.profile.labeler.error.unavailable']()}
						details={cleanError(error) || m['common.error.generic']()}
					/>
				)}
			</Layout.Content>
		</Layout.Screen>
	);
}

/** whether the viewer has this labeler in their moderation preferences; app labelers are always on. */
function useIsSubscribed(did: Did) {
	const { data: preferences } = usePreferencesQuery();
	return isAppLabeler(did) || !!preferences?.moderationPrefs.labelers.some((labeler) => labeler.did === did);
}

function LabelerActions({ labeler }: { labeler: AppBskyLabelerDefs.LabelerViewDetailed }) {
	const { creator } = labeler;
	const requireAuth = useRequireAuth();
	const isSubscribed = useIsSubscribed(creator.did);
	const isApp = isAppLabeler(creator.did);
	const { mutateAsync: toggleSubscription, isPending } = useLabelerSubscriptionMutation();
	const subscribeConfirmPrompt = Prompt.usePromptHandle();
	const unsubscribeConfirmPrompt = Prompt.usePromptHandle();
	const subscribeLimitPrompt = Prompt.usePromptHandle();
	const profileLink = useInternalLink({ to: profileTarget(creator.did) });

	// signing in mid-flow replaces the screen, so ask for the session before the confirmation
	const onRequestToggle = (subscribe: boolean) => {
		requireAuth(() => (subscribe ? subscribeConfirmPrompt : unsubscribeConfirmPrompt).open(null));
	};

	const onToggleSubscription = async (subscribe: boolean): Promise<void> => {
		try {
			await toggleSubscription({ did: creator.did, subscribe });
		} catch (e) {
			if (e instanceof Error && e.message === 'MAX_LABELERS') {
				subscribeLimitPrompt.open(null);
				return;
			}
			console.error('Failed to subscribe to labeler', e);
			Toast.show(m['screens.profile.error.server'](), { type: 'error' });
		}
	};

	return (
		<>
			{!isSubscribed && (
				<Button
					color="primary"
					disabled={isPending}
					label={m['screens.profile.labeler.action.subscribeThis']()}
					onClick={() => onRequestToggle(true)}
					size="small"
				>
					{isPending && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
					<ButtonText>{m['screens.profile.labeler.action.subscribe']()}</ButtonText>
				</Button>
			)}

			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							color="secondary"
							label={m['common.a11y.moreOptions']()}
							shape="round"
							size="small"
							variant="ghost"
						>
							<ButtonIcon icon={Ellipsis} size="sm" />
						</Button>
					}
				/>
				<Menu.Popup align="end" label={m['common.a11y.moreOptions']()} minWidth={170}>
					<Menu.Item
						label={m['screens.profile.labeler.action.viewProfile']()}
						render={<a href={profileLink.href} onClick={profileLink.onClick} />}
					>
						<Menu.ItemText>{m['screens.profile.labeler.action.viewProfile']()}</Menu.ItemText>
						<Menu.ItemIcon icon={UserCircle} />
					</Menu.Item>
					{!isApp && isSubscribed && (
						<Menu.Item
							label={m['screens.profile.labeler.action.unsubscribeThis']()}
							onClick={() => onRequestToggle(false)}
						>
							<Menu.ItemText>{m['screens.profile.labeler.action.unsubscribe']()}</Menu.ItemText>
							<Menu.ItemIcon icon={CircleBanSign} />
						</Menu.Item>
					)}
				</Menu.Popup>
			</Menu.Root>

			<Prompt.Basic
				confirmButtonCta={m['screens.profile.labeler.action.subscribe']()}
				description={m['screens.profile.labeler.subscribe.confirm.message']()}
				handle={subscribeConfirmPrompt}
				onConfirm={() => void onToggleSubscription(true)}
				title={m['screens.profile.labeler.subscribe.confirm.title']()}
			/>

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={m['screens.profile.labeler.action.unsubscribe']()}
				description={m['screens.profile.labeler.unsubscribe.confirm.message']()}
				handle={unsubscribeConfirmPrompt}
				onConfirm={() => void onToggleSubscription(false)}
				title={m['screens.profile.labeler.unsubscribe.confirm.title']()}
			/>

			<Prompt.Basic
				confirmButtonCta={m['screens.profile.action.ok']()}
				description={m['screens.profile.labeler.error.subscribeLimit']({ limit: MAX_LABELERS })}
				handle={subscribeLimitPrompt}
				onConfirm={() => {}}
				showCancel={false}
				title={m['screens.profile.labeler.error.subscribeLimitTitle']()}
			/>
		</>
	);
}

function LabelerDetails({ labeler }: { labeler: AppBskyLabelerDefs.LabelerViewDetailed }) {
	const { creator } = labeler;
	const isSubscribed = useIsSubscribed(creator.did);
	const [openLabel, setOpenLabel] = useState<string | null>(null);

	const customDefs = Object.values(interpretLabelerDefinition(labeler));
	const labelValues = mapDefined(unique(labeler.policies.labelValues), (val) => {
		const def = lookupLabelValueDefinition(val, customDefs);
		if (def === undefined || def.flags & LabelFlags.NoConfigurable) {
			return;
		}

		return def;
	});
	const hasValues = labelValues.length > 0;

	return (
		<>
			<div className={css.aboutSection}>
				<div className={css.identity}>
					<UserAvatar avatar={creator.avatar} size={56} type="labeler" />
					<div className={css.identityText}>
						<Text numberOfLines={2} size="xl" weight="semiBold">
							{profileDisplayName(creator)}
						</Text>
						<Text color="textContrastMedium" numberOfLines={1}>
							{`@${creator.handle}`}
						</Text>
					</div>
				</div>

				{creator.description ? (
					<RichText authorHandle={creator.handle} enableTags size="md" value={creator.description} />
				) : null}

				{!isAppLabeler(creator.did) && <LikeRow labeler={labeler} />}

				{creator.viewer?.blocking ? (
					<div className={css.blockHint}>
						<CircleInfo className={css.circleInfoIcon} />
						<Text size="md_sub" color="textContrastMedium">
							{m['screens.profile.labeler.blockHint']()}
						</Text>
					</div>
				) : null}
			</div>
			<div className={css.settingsSection}>
				{!hasValues ? (
					<Text size="md_sub" color="textContrastMedium">
						{m['screens.profile.labeler.noLabelsDeclared']()}
					</Text>
				) : !isSubscribed ? (
					<Text size="md_sub" color="textContrastMedium">
						{m['screens.profile.labeler.subscribePrompt']({ handle: creator.handle })}
					</Text>
				) : null}

				{hasValues && (
					<Settings.Section
						bodyText={m['screens.profile.labeler.lastUpdated']({
							date: dateTimeLong.format(new Date(labeler.indexedAt)),
						})}
						titleText={m['screens.profile.labeler.availableLabels']()}
					>
						{labelValues.map((labelDefinition) => (
							<LabelerLabelRow
								disabled={!isSubscribed}
								key={labelDefinition.identifier}
								labelDefinition={labelDefinition}
								labelerDid={creator.did}
								onOpenChange={(open) => setOpenLabel(open ? labelDefinition.identifier : null)}
								open={openLabel === labelDefinition.identifier}
							/>
						))}
					</Settings.Section>
				)}
			</div>
		</>
	);
}

function LikeRow({ labeler }: { labeler: AppBskyLabelerDefs.LabelerViewDetailed }) {
	const requireAuth = useRequireAuth();
	const { isPending: isLikePending, mutateAsync: likeMod } = useLikeMutation();
	const { isPending: isUnlikePending, mutateAsync: unlikeMod } = useUnlikeMutation();
	const [likeUri, setLikeUri] = useState(labeler.viewer?.like || '');
	// derive the count from the pending toggle rather than mirroring it, so a refetched view corrects itself
	const likeDelta = (likeUri ? 1 : 0) - (labeler.viewer?.like ? 1 : 0);
	const likeCount = (labeler.likeCount || 0) + likeDelta;

	const onToggleLiked = () =>
		requireAuth(async (): Promise<void> => {
			try {
				if (likeUri) {
					await unlikeMod({ uri: likeUri });
					setLikeUri('');
				} else {
					const res = await likeMod({ cid: labeler.cid, uri: labeler.uri });
					setLikeUri(res.uri);
				}
			} catch (e) {
				console.error('Failed to toggle labeler like', e);
				Toast.show(m['screens.profile.error.server'](), { type: 'error' });
			}
		});

	return (
		<div className={css.likeRow}>
			<Button
				color="secondary"
				disabled={isLikePending || isUnlikePending}
				label={m['screens.profile.labeler.action.like']()}
				onClick={onToggleLiked}
				shape="round"
				size="small"
			>
				{likeUri ? <HeartFilled className={css.heartFilledIcon} /> : <Heart className={css.heartIcon} />}
			</Button>
			<InlineLinkText
				color="textContrastMedium"
				label={m['screens.profile.feed.likes.count']({ count: likeCount })}
				size="sm"
				to={{ name: 'ProfileLabelerLikedBy', actor: labeler.creator.did }}
				weight="semiBold"
			>
				{m['screens.profile.feed.likes.count']({ count: likeCount })}
			</InlineLinkText>
		</div>
	);
}
