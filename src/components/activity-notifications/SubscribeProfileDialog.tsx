import { useMemo, useState } from 'react';
import type {
	AnyProfileView,
	AppBskyNotificationDefs,
	AppBskyNotificationListActivitySubscriptions,
} from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import { Trans, useLingui } from '@lingui/react/macro';
import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { RQKEY_getActivitySubscriptions } from '#/state/queries/activity-subscriptions';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, type ButtonProps, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';
import * as ProfileCard from '#/components/web/ProfileCard';

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
	const { t: l } = useLingui();
	const name = createSanitizedDisplayName(profile, false);
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={l`Get notified of new posts from ${name}`}>
				<DialogInner
					handle={handle}
					profile={profile}
					moderationOpts={moderationOpts}
					includeProfile={includeProfile}
				/>
				<Dialog.Close />
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
	const { t: l } = useLingui();
	const { appview } = useClients();
	const queryClient = useQueryClient();
	const initialState = parseActivitySubscription(profile.viewer?.activitySubscription);
	const [state, setState] = useState(initialState);

	const selected: SubscriptionChoice = state.post ? (state.reply ? 'all' : 'posts') : 'off';

	const onSelect = ([value]: string[]) => {
		setState(CHOICE_STATES[value as SubscriptionChoice]);
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
				Toast.show(l`You will no longer receive notifications for ${sanitizeHandle(profile.handle, '@')}`, {
					type: 'success',
				});

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
					Toast.show(l`You'll start receiving notifications for ${sanitizeHandle(profile.handle, '@')}!`, {
						type: 'success',
					});
				} else {
					Toast.show(l`Changes saved`, {
						type: 'success',
					});
				}
			}
		},
		onError: (err) => {
			logger.error('Could not save activity subscription', { message: err });
		},
	});

	const buttonProps: Omit<ButtonProps, 'children'> = useMemo(() => {
		const isDirty = state.post !== initialState.post || state.reply !== initialState.reply;
		const hasAny = state.post || state.reply;

		if (isDirty) {
			return {
				label: l`Save changes`,
				color: hasAny ? 'primary' : 'negative',
				onClick: () => saveChanges(state),
				disabled: isSaving,
			};
		} else {
			return {
				label: l`Save changes`,
				color: 'secondary',
				disabled: true,
			};
		}
	}, [state, initialState, l, isSaving, saveChanges]);

	return (
		<div className={styles.content}>
			<div className={styles.header}>
				<Text size="_2xl" weight="bold">
					<Trans>Keep me posted</Trans>
				</Text>
				<Text color="textContrastMedium" size="md">
					<Trans>Get notified of this account’s activity</Trans>
				</Text>
			</div>

			{includeProfile && (
				<ProfileCard.Header>
					<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} disabledPreview />
					<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
				</ProfileCard.Header>
			)}

			<Toggle.Group
				className={styles.radioList}
				label={l`Subscribe to account activity`}
				onChange={onSelect}
				type="radio"
				values={[selected]}
			>
				<Toggle.RadioItem label={l`Posts and replies`} value="all">
					<Toggle.Panel>
						<Toggle.RadioIndicator />
						<Toggle.PanelText>
							<Trans>Posts and replies</Trans>
						</Toggle.PanelText>
					</Toggle.Panel>
				</Toggle.RadioItem>
				<Toggle.RadioItem label={l`Posts only`} value="posts">
					<Toggle.Panel>
						<Toggle.RadioIndicator />
						<Toggle.PanelText>
							<Trans>Posts only</Trans>
						</Toggle.PanelText>
					</Toggle.Panel>
				</Toggle.RadioItem>
				<Toggle.RadioItem label={l`Off`} value="off">
					<Toggle.Panel>
						<Toggle.RadioIndicator />
						<Toggle.PanelText>
							<Trans>Off</Trans>
						</Toggle.PanelText>
					</Toggle.Panel>
				</Toggle.RadioItem>
			</Toggle.Group>

			{error && (
				<Admonition type="error">
					<Trans>Could not save changes: {cleanError(error)}</Trans>
				</Admonition>
			)}

			<Button {...buttonProps} size="large" variant="solid">
				<ButtonText>{buttonProps.label}</ButtonText>
				{isSaving && <ButtonIcon icon={Loader} />}
			</Button>
		</div>
	);
}

function parseActivitySubscription(
	sub?: AppBskyNotificationDefs.ActivitySubscription,
): Omit<AppBskyNotificationDefs.ActivitySubscription, '$type'> {
	if (!sub) return { post: false, reply: false };
	const { post, reply } = sub;
	return { post, reply };
}
