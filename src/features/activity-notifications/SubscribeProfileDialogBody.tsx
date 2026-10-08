import { useState } from 'react';

import type {
	AnyProfileView,
	AppBskyNotificationDefs,
	AppBskyNotificationListActivitySubscriptions,
} from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { cleanError } from '#/lib/errors';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { getClients } from '#/state/session';

import { RQKEY_getActivitySubscriptions } from '#/features/activity-notifications/queries';

import * as Dialog from '#/components/Dialog';
import * as ChoiceCard from '#/components/forms/ChoiceCard';
import * as Radio from '#/components/primitives/radio';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonSpinner, type ButtonProps, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import BellOffIcon from '#/icons/central/BellOff_round_outlined_radius1_stroke2.svg';
import BubbleIcon from '#/icons/central/Bubble2_round_outlined_radius1_stroke2.svg';
import BubblesIcon from '#/icons/central/Bubbles_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

type SubscriptionChoice = 'all' | 'off' | 'posts';

// the three reachable subscription states; `reply` can't be set without `post`.
const CHOICE_STATES: Record<SubscriptionChoice, { post: boolean; reply: boolean }> = {
	all: { post: true, reply: true },
	off: { post: false, reply: false },
	posts: { post: true, reply: false },
};

/**
 * edits notifications for a profile's posts and replies.
 *
 * @param props profile and dialog options
 * @returns the subscription controls
 */
export function SubscribeProfileDialogBody({
	handle,
	profile,
	moderationOpts,
	includeProfile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
	includeProfile?: boolean;
}) {
	const { appview } = getClients();
	const queryClient = useQueryClient();
	const initialState = parseActivitySubscription(profile.viewer?.activitySubscription);
	const [state, setState] = useState(initialState);

	const selected: SubscriptionChoice = state.post ? (state.reply ? 'all' : 'posts') : 'off';

	const {
		mutate: saveChanges,
		isPending: isSaving,
		error,
	} = useMutation({
		mutationFn: async (activitySubscription: Omit<AppBskyNotificationDefs.ActivitySubscription, '$type'>) => {
			await ok(
				appview.post('app.bsky.notification.putActivitySubscription', {
					input: {
						subject: profile.did,
						activitySubscription,
					},
				}),
			);
		},
		onSuccess: (_data, activitySubscription) => {
			handle.close();
			updateProfileShadow(queryClient, profile.did, {
				activitySubscription,
			});

			if (!activitySubscription.post && !activitySubscription.reply) {
				Toast.show(
					m['components.activityNotifications.unsubscribedToast']({
						handle: `@${profile.handle}`,
					}),
					{
						type: 'success',
					},
				);

				// filter out the subscription
				queryClient.setQueryData(
					RQKEY_getActivitySubscriptions,
					(old?: InfiniteData<AppBskyNotificationListActivitySubscriptions.$output>) => {
						if (!old) {
							return old;
						}
						return {
							...old,
							pages: old.pages.map((page) => ({
								...page,
								subscriptions: page.subscriptions.filter((item) => item.did !== profile.did),
							})),
						};
					},
				);
			} else {
				if (!initialState.post && !initialState.reply) {
					Toast.show(
						m['components.activityNotifications.subscribedToast']({
							handle: `@${profile.handle}`,
						}),
						{
							type: 'success',
						},
					);
				} else {
					Toast.show(m['components.activityNotifications.savedToast'](), {
						type: 'success',
					});
				}
			}
		},
		onError: (err) => {
			console.error('Could not save activity subscription', err);
		},
	});

	const isDirty = state.post !== initialState.post || state.reply !== initialState.reply;
	const hasAny = state.post || state.reply;

	let buttonProps: Omit<ButtonProps, 'children'>;
	if (isDirty) {
		buttonProps = {
			label: m['common.action.saveChanges'](),
			color: hasAny ? 'primary' : 'negative',
			onClick: () => saveChanges(state),
			disabled: isSaving,
		};
	} else {
		buttonProps = {
			label: m['common.action.saveChanges'](),
			color: 'secondary',
			disabled: true,
		};
	}

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['components.activityNotifications.subscribe']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
				<Text color="textContrastMedium" size="md">
					{m['components.activityNotifications.activityHint']()}
				</Text>
			</Stack>

			{includeProfile && (
				<ProfileCard.Header>
					<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} disabledPreview />
					<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
				</ProfileCard.Header>
			)}

			<Radio.Group<SubscriptionChoice>
				aria-label={m['components.activityNotifications.title']()}
				onValueChange={(value) => setState(CHOICE_STATES[value])}
				render={<ChoiceCard.List />}
				value={selected}
			>
				<ChoiceCard.Radio
					icon={BubblesIcon}
					titleText={m['components.activityNotifications.postsAndReplies']()}
					value="all"
				/>
				<ChoiceCard.Radio
					icon={BubbleIcon}
					titleText={m['components.activityNotifications.postsOnly']()}
					value="posts"
				/>
				<ChoiceCard.Radio icon={BellOffIcon} titleText={m['common.status.off']()} value="off" />
			</Radio.Group>

			{error && (
				<Admonition type="error">
					{m['components.activityNotifications.saveError']({ error: cleanError(error) })}
				</Admonition>
			)}

			<Dialog.Actions>
				<Button {...buttonProps} variant="solid">
					<ButtonText>{buttonProps.label}</ButtonText>
					{isSaving && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}

function parseActivitySubscription(
	sub?: AppBskyNotificationDefs.ActivitySubscription,
): Omit<AppBskyNotificationDefs.ActivitySubscription, '$type'> {
	if (!sub) {
		return { post: false, reply: false };
	}
	const { post, reply } = sub;
	return { post, reply };
}
