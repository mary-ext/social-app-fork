import { useState } from 'react';
import { View } from 'react-native';

import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { useGoBack } from '#/lib/hooks/useGoBack';

import { RQKEY_ROOT as listQueryRoot, useListBlockMutation, useListMuteMutation } from '#/state/queries/list';
import { type UsePreferencesQueryResponse, useRemoveFeedMutation } from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { CenteredView } from '#/view/com/util/Views';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { useHider } from '#/components/moderation/Hider';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function ListHiddenScreen({
	list,
	preferences,
}: {
	list: AppBskyGraphDefs.ListView;
	preferences: UsePreferencesQueryResponse;
}) {
	const t = useTheme();
	const { currentAccount } = useSession();
	const { gtMobile } = useBreakpoints();
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
		if (!savedFeedConfig) return;
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
		<CenteredView
			style={[
				a.flex_1,
				a.align_center,
				a.gap_5xl,
				!gtMobile && a.justify_between,
				t.atoms.border_contrast_low,
				{ paddingTop: 175, paddingBottom: 110 },
			]}
			sideBorders={true}
		>
			<View style={[a.w_full, a.align_center, a.gap_lg]}>
				<EyeSlash style={{ color: t.atoms.text_contrast_medium.color }} height={42} width={42} />
				<View style={[a.gap_sm, a.align_center]}>
					<Text style={[a.font_semi_bold, a.text_3xl]}>
						{list.creator.viewer?.blocking || list.creator.viewer?.blockedBy
							? m['screens.list.block.title']()
							: m['screens.list.hidden.title']()}
					</Text>
					<Text style={[a.text_md, a.text_center, a.px_md, t.atoms.text_contrast_high, { lineHeight: 1.4 }]}>
						{list.creator.viewer?.blocking || list.creator.viewer?.blockedBy ? (
							m['screens.list.block.message']()
						) : isOwner ? (
							m['screens.list.violation.byYou']()
						) : (
							<Trans
								message={m['screens.list.violation.byOther']}
								inputs={{ handle: list.creator.handle }}
								markup={{
									t0: ({ children }) => <Text style={[a.font_semi_bold]}>{children}</Text>,
								}}
							/>
						)}
					</Text>
				</View>
			</View>
			<View style={[a.gap_md, gtMobile ? { width: 350 } : [a.w_full, a.px_lg]]}>
				<View style={[a.gap_md]}>
					{savedFeedConfig ? (
						<Button
							variant="solid"
							color="secondary"
							size="large"
							label={m['screens.list.savedFeeds.remove']()}
							onPress={() => void onRemoveList()}
							disabled={isProcessing}
						>
							<ButtonText>{m['screens.list.savedFeeds.remove']()}</ButtonText>
							{isProcessing && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
						</Button>
					) : null}
					{isOwner ? (
						<Button
							variant="solid"
							color="secondary"
							size="large"
							label={m['screens.list.hidden.showAnyway']()}
							onPress={() => setIsContentVisible(true)}
							disabled={isProcessing}
						>
							<ButtonText>{m['common.moderation.showAnyway']()}</ButtonText>
						</Button>
					) : list.viewer?.muted || list.viewer?.blocked ? (
						<Button
							variant="solid"
							color="secondary"
							size="large"
							label={m['screens.list.subscription.unsubscribe']()}
							onPress={() => {
								if (isModList) {
									void onUnsubscribe();
								} else {
									void onRemoveList();
								}
							}}
							disabled={isProcessing}
						>
							<ButtonText>{m['screens.list.subscription.unsubscribe']()}</ButtonText>
							{isProcessing && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
						</Button>
					) : null}
				</View>
				<Button
					variant="solid"
					color="primary"
					label={m['common.action.returnToPreviousPage']()}
					onPress={goBack}
					size="large"
					disabled={isProcessing}
				>
					<ButtonText>{m['common.action.goBackTitle']()}</ButtonText>
				</Button>
			</View>
		</CenteredView>
	);
}
