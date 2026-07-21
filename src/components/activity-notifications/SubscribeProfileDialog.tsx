import { useState } from 'react';

import type {
	AnyProfileView,
	AppBskyNotificationDefs,
	AppBskyNotificationListActivitySubscriptions,
} from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { cleanError } from '#/lib/strings/errors';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { RQKEY_getActivitySubscriptions } from '#/state/queries/activity-subscriptions';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Spinner } from '#/components/Spinner';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, type ButtonProps, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

import * as styles from './SubscribeProfileDialog.css';

type SubscriptionChoice = 'all' | 'off' | 'posts';

// the three reachable subscription states; `reply` can't be set without `post`.
const CHOICE_STATES: Record<SubscriptionChoice, { post: boolean; reply: boolean }> = {
	all: { post: true, reply: true },
	off: { post: false, reply: false },
	posts: { post: true, reply: false },
};

export function SubscribeProfileDialog({
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
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<DialogInner
					handle={handle}
					profile={profile}
					moderationOpts={moderationOpts}
					includeProfile={includeProfile}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
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
	const { appview } = useClients();
	const queryClient = useQueryClient();
	const initialState = parseActivitySubscription(profile.viewer?.activitySubscription);
	const [state, setState] = useState(initialState);

	const selected: SubscriptionChoice = state.post ? (state.reply ? 'all' : 'posts') : 'off';

	const onSelect = ([value]: string[]) => {
		// the group is a radio set over `CHOICE_STATES`, but `Toggle.Group` reports a bare `string[]`
		switch (value) {
			case 'all':
			case 'off':
			case 'posts': {
				setState(CHOICE_STATES[value]);
				break;
			}
		}
	};

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
						if (!old) return old;
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
			logger.error('Could not save activity subscription', { message: err });
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

			<Toggle.Group
				className={styles.radioList}
				label={m['components.activityNotifications.title']()}
				onChange={onSelect}
				type="radio"
				values={[selected]}
			>
				<Toggle.RadioItem label={m['components.activityNotifications.postsAndReplies']()} value="all">
					<Toggle.Panel>
						<Toggle.RadioIndicator />
						<Toggle.PanelText>{m['components.activityNotifications.postsAndReplies']()}</Toggle.PanelText>
					</Toggle.Panel>
				</Toggle.RadioItem>
				<Toggle.RadioItem label={m['components.activityNotifications.postsOnly']()} value="posts">
					<Toggle.Panel>
						<Toggle.RadioIndicator />
						<Toggle.PanelText>{m['components.activityNotifications.postsOnly']()}</Toggle.PanelText>
					</Toggle.Panel>
				</Toggle.RadioItem>
				<Toggle.RadioItem label={m['common.status.off']()} value="off">
					<Toggle.Panel>
						<Toggle.RadioIndicator />
						<Toggle.PanelText>{m['common.status.off']()}</Toggle.PanelText>
					</Toggle.Panel>
				</Toggle.RadioItem>
			</Toggle.Group>

			{error && (
				<Admonition type="error">
					{m['components.activityNotifications.saveError']({ error: cleanError(error) })}
				</Admonition>
			)}

			<Dialog.Actions>
				<Button {...buttonProps} variant="solid">
					<ButtonText>{buttonProps.label}</ButtonText>
					{isSaving && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}

function parseActivitySubscription(
	sub?: AppBskyNotificationDefs.ActivitySubscription,
): Omit<AppBskyNotificationDefs.ActivitySubscription, '$type'> {
	if (!sub) return { post: false, reply: false };
	const { post, reply } = sub;
	return { post, reply };
}
