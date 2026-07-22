import { useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { useGoBack } from '#/lib/hooks/useGoBack';

import { RQKEY_ROOT as listQueryRoot, useListBlockMutation, useListMuteMutation } from '#/state/queries/list';
import { type UsePreferencesQueryResponse, useRemoveFeedMutation } from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { useHider } from '#/components/moderation/Hider';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as styles from './ListHiddenScreen.css';

/** Screen displayed when a list's content is hidden due to user preferences or moderation rules. */
export function ListHiddenScreen({
	list,
	preferences,
}: {
	list: AppBskyGraphDefs.ListView;
	preferences: UsePreferencesQueryResponse;
}) {
	const { currentAccount } = useSession();
	const isOwner = currentAccount?.did === list.creator.did;
	const goBack = useGoBack();
	const queryClient = useQueryClient();

	const isModList = list.purpose === 'app.bsky.graph.defs#modlist';

	const [isProcessing, setIsProcessing] = useState(false);
	const listBlockMutation = useListBlockMutation();
	const listMuteMutation = useListMuteMutation();
	const { mutateAsync: removeSavedFeed } = useRemoveFeedMutation();

	const { setIsContentVisible } = useHider();

	const savedFeedConfig = preferences.savedFeeds.find((f) => f.value === list.uri);

	const onUnsubscribe = async () => {
		setIsProcessing(true);
		if (list.viewer?.muted) {
			try {
				await listMuteMutation.mutateAsync({ uri: list.uri, mute: false });
			} catch (e) {
				setIsProcessing(false);
				logger.error('Failed to unmute list', { message: e });
				Toast.show(m['common.error.issueConnection']());
				return;
			}
		}
		if (list.viewer?.blocked) {
			try {
				await listBlockMutation.mutateAsync({ uri: list.uri, block: false });
			} catch (e) {
				setIsProcessing(false);
				logger.error('Failed to unblock list', { message: e });
				Toast.show(m['common.error.issueConnection']());
				return;
			}
		}
		void queryClient.invalidateQueries({
			queryKey: [listQueryRoot],
		});
		Toast.show(m['screens.list.subscription.unsubscribedToast']());
		setIsProcessing(false);
	};

	const onRemoveList = async () => {
		if (!savedFeedConfig) {
			return;
		}
		try {
			await removeSavedFeed(savedFeedConfig);
			Toast.show(m['screens.list.savedFeeds.removedToast']());
		} catch (e) {
			logger.error('Failed to remove list from saved feeds', { message: e });
			Toast.show(m['common.error.issueConnection']());
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.iconBox}>
				<EyeSlash fill={colors.textContrastLow} size="3xl" />
			</div>
			<Text align="center" className={styles.title} size="xl" weight="semiBold">
				{list.creator.viewer?.blocking || list.creator.viewer?.blockedBy
					? m['screens.list.block.title']()
					: m['screens.list.hidden.title']()}
			</Text>
			<Text align="center" className={styles.message} color="textContrastHigh" size="md" weight="medium">
				{list.creator.viewer?.blocking || list.creator.viewer?.blockedBy ? (
					m['screens.list.block.message']()
				) : isOwner ? (
					m['screens.list.violation.byYou']()
				) : (
					<Trans
						inputs={{ handle: list.creator.handle }}
						markup={{
							t0: ({ children }) => <Text weight="semiBold">{children}</Text>,
						}}
						message={m['screens.list.violation.byOther']}
					/>
				)}
			</Text>
			<div className={styles.buttonWrap}>
				{savedFeedConfig ? (
					<Button
						color="secondary"
						disabled={isProcessing}
						label={m['screens.list.savedFeeds.remove']()}
						onClick={() => void onRemoveList()}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['screens.list.savedFeeds.remove']()}</ButtonText>
						{isProcessing && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
					</Button>
				) : null}
				{isOwner ? (
					<Button
						color="secondary"
						disabled={isProcessing}
						label={m['screens.list.hidden.showAnyway']()}
						onClick={() => setIsContentVisible(true)}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['common.moderation.showAnyway']()}</ButtonText>
					</Button>
				) : list.viewer?.muted || list.viewer?.blocked ? (
					<Button
						color="secondary"
						disabled={isProcessing}
						label={m['screens.list.subscription.unsubscribe']()}
						onClick={() => {
							if (isModList) {
								void onUnsubscribe();
							} else {
								void onRemoveList();
							}
						}}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['screens.list.subscription.unsubscribe']()}</ButtonText>
						{isProcessing && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
					</Button>
				) : null}
				<Button
					color="primary"
					disabled={isProcessing}
					label={m['common.action.returnToPreviousPage']()}
					onClick={goBack}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.goBackTitle']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}
