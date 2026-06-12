import { memo, useCallback, useState } from 'react';
import type { AppBskyActorDefs, AppBskyLabelerDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { plural } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { isAppLabeler } from '#/lib/moderation';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { useLabelerSubscriptionMutation } from '#/state/queries/labeler';
import { useLikeMutation, useUnlikeMutation } from '#/state/queries/like';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useRequireAuth } from '#/state/session';

import { logger } from '#/logger';

import { ProfileMenu } from '#/view/com/profile/ProfileMenu';

import {
	Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
	Heart2_Stroke2_Corner0_Rounded as Heart,
} from '#/components/icons/Heart2';
import * as Toast from '#/components/Toast';
import { Button } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';
import * as Prompt from '#/components/web/Prompt';
import { Text } from '#/components/web/Text';

import { EditProfileButton } from './Actions';
import { ProfileHeaderBio } from './Bio';
import { ProfileHeaderProvider, useProfileHeader } from './Context';
import { ProfileHeaderDisplayName } from './DisplayName';
import { ProfileHeaderHandle } from './Handle';
import * as css from './Labeler.css';
import { ProfileHeaderMetrics } from './Metrics';
import { ProfileHeaderShell } from './Shell';

interface Props {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	labeler: AppBskyLabelerDefs.LabelerViewDetailed;
	descriptionRT: Richtext | null;
	moderationOpts: ModerationOptions;
	hideBackButton?: boolean;
	isPlaceholderProfile?: boolean;
}

/** Keep this in sync with the value of MAX_LABELERS */
function CantSubscribePrompt({ handle }: { handle: Prompt.PromptHandle }) {
	const { t: l } = useLingui();
	return (
		<Prompt.Outer handle={handle}>
			<Prompt.Content>
				<Prompt.TitleText>Unable to subscribe</Prompt.TitleText>
				<Prompt.DescriptionText>
					<Trans>
						We're sorry! You can only subscribe to twenty labelers, and you've reached your limit of twenty.
					</Trans>
				</Prompt.DescriptionText>
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action cta={l`OK`} onPress={() => handle.close()} />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}

function SubscribeLabelerButton() {
	const { t: l } = useLingui();
	const {
		state: { profile },
	} = useProfileHeader();
	const requireAuth = useRequireAuth();
	const { data: preferences } = usePreferencesQuery();
	const { mutateAsync: toggleSubscription, reset, variables } = useLabelerSubscriptionMutation();
	const isSubscribed =
		variables?.subscribe ??
		preferences?.moderationPrefs.labelers.find((labeler) => labeler.did === profile.did);
	const cantSubscribePrompt = Prompt.usePromptHandle();

	const onPressSubscribe = () =>
		requireAuth(async (): Promise<void> => {
			const subscribe = !isSubscribed;
			try {
				await toggleSubscription({ did: profile.did, subscribe });
			} catch (e) {
				reset();
				if (e instanceof Error && e.message === 'MAX_LABELERS') {
					cantSubscribePrompt.open(null);
					return;
				}
				logger.error(`Failed to subscribe to labeler`, {
					message: e instanceof Error ? e.message : String(e),
				});
			}
		});

	return (
		<>
			<button
				aria-label={isSubscribed ? l`Unsubscribe from this labeler` : l`Subscribe to this labeler`}
				className={clsx(css.subscribeButton, isSubscribed ? css.subscribed : css.unsubscribed)}
				onClick={onPressSubscribe}
				type="button"
			>
				<Text
					align="center"
					color={isSubscribed ? 'contrast_700' : 'white'}
					leading="tight"
					weight="semiBold"
				>
					{isSubscribed ? <Trans>Unsubscribe</Trans> : <Trans>Subscribe to Labeler</Trans>}
				</Text>
			</button>
			<CantSubscribePrompt handle={cantSubscribePrompt} />
		</>
	);
}

function LabelerActions() {
	const {
		meta: { isMe },
		state: { profile },
	} = useProfileHeader();

	return (
		<>
			{isMe ? <EditProfileButton /> : !isAppLabeler(profile.did) ? <SubscribeLabelerButton /> : null}
			<ProfileMenu profile={profile} />
		</>
	);
}

function LikeButton({ labeler }: { labeler: AppBskyLabelerDefs.LabelerViewDetailed }) {
	const { t: l } = useLingui();
	const {
		meta: { hasSession },
	} = useProfileHeader();
	const { isPending: isLikePending, mutateAsync: likeMod } = useLikeMutation();
	const { isPending: isUnlikePending, mutateAsync: unlikeMod } = useUnlikeMutation();
	const [likeUri, setLikeUri] = useState(labeler.viewer?.like || '');
	const [likeCount, setLikeCount] = useState(labeler.likeCount || 0);

	const onToggleLiked = useCallback(async () => {
		try {
			if (likeUri) {
				await unlikeMod({ uri: likeUri });
				setLikeCount((c) => c - 1);
				setLikeUri('');
			} else {
				const res = await likeMod({ cid: labeler.cid, uri: labeler.uri });
				setLikeCount((c) => c + 1);
				setLikeUri(res.uri);
			}
		} catch (e) {
			Toast.show(
				l`There was an issue contacting the server, please check your internet connection and try again.`,
				{ type: 'error' },
			);
			logger.error(`Failed to toggle labeler like`, {
				message: e instanceof Error ? e.message : String(e),
			});
		}
	}, [labeler, likeUri, unlikeMod, likeMod, l]);

	return (
		<div className={css.likeRow}>
			<Button
				color="secondary"
				disabled={!hasSession || isLikePending || isUnlikePending}
				label={l`Like this labeler`}
				onClick={() => void onToggleLiked()}
				shape="round"
				size="small"
			>
				{likeUri ? (
					<span className={css.heartLiked}>
						<HeartFilled width={18} height={18} fill="currentColor" />
					</span>
				) : (
					<span className={css.heartDefault}>
						<Heart width={18} height={18} fill="currentColor" />
					</span>
				)}
			</Button>

			<InlineLinkText
				className={css.likedBy}
				color="textContrastMedium"
				label={l`Liked by ${plural(likeCount, { one: '# user', other: '# users' })}`}
				size="sm"
				to={{ params: { name: labeler.creator.did }, screen: 'ProfileLabelerLikedBy' }}
				weight="semiBold"
			>
				<Trans>
					Liked by <Plural value={likeCount} one="# user" other="# users" />
				</Trans>
			</InlineLinkText>
		</div>
	);
}

function LabelerBody({ labeler }: { labeler: AppBskyLabelerDefs.LabelerViewDetailed }) {
	const {
		meta: { isMe, isPlaceholderProfile },
		state: { profile },
	} = useProfileHeader();

	return (
		<div className={css.body}>
			<div className={css.buttonRow}>
				<LabelerActions />
			</div>

			<div className={css.nameBlock}>
				<ProfileHeaderDisplayName />
				<ProfileHeaderHandle profile={profile} />
			</div>

			{!isPlaceholderProfile && (
				<>
					{isMe && <ProfileHeaderMetrics />}

					<ProfileHeaderBio />

					{!isAppLabeler(profile.did) && <LikeButton labeler={labeler} />}
				</>
			)}
		</div>
	);
}

/** Profile header for a labeler account. */
let LabelerProfileHeader = ({
	descriptionRT,
	hideBackButton = false,
	isPlaceholderProfile,
	labeler,
	moderationOpts,
	profile,
}: Props): React.ReactNode => {
	return (
		<ProfileHeaderProvider
			descriptionRT={descriptionRT}
			hideBackButton={hideBackButton}
			isPlaceholderProfile={isPlaceholderProfile}
			moderationOpts={moderationOpts}
			profile={profile}
		>
			<ProfileHeaderShell>
				<LabelerBody labeler={labeler} />
			</ProfileHeaderShell>
		</ProfileHeaderProvider>
	);
};

LabelerProfileHeader = memo(LabelerProfileHeader);
export { LabelerProfileHeader };
