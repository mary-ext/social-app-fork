import { useCallback, useMemo, useState } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedPostgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useMyListsQuery } from '#/state/queries/my-lists';
import { useGetPost } from '#/state/queries/post';
import {
	createPostgateQueryKey,
	getPostgateRecord,
	usePostgateQuery,
	useWritePostgateMutation,
} from '#/state/queries/postgate';
import { createPostgateRecord, embeddingRules } from '#/state/queries/postgate/util';
import {
	createThreadgateViewQueryKey,
	type ThreadgateAllowUISetting,
	threadgateViewToAllowUISetting,
	useSetThreadgateAllowMutation,
	useThreadgateViewQuery,
} from '#/state/queries/threadgate';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import * as styles from '#/components/dialogs/PostInteractionSettingsDialog.css';
import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon } from '#/components/icons/Quote';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonText } from '#/components/web/Button';
import * as WebDialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';

import { colors } from '#/styles/colors';

export type PostInteractionSettingsFormProps = {
	canSave?: boolean;
	onSave: () => void;
	isSaving?: boolean;

	isDirty?: boolean;
	persist?: boolean;
	onChangePersist?: (v: boolean) => void;

	postgate: AppBskyFeedPostgate.Main;
	onChangePostgate: (v: AppBskyFeedPostgate.Main) => void;

	threadgateAllowUISettings: ThreadgateAllowUISetting[];
	onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void;

	replySettingsDisabled?: boolean;
};

/** Threadgate settings dialog. Used in the composer. */
export function PostInteractionSettingsControlledDialog({
	handle,
	...rest
}: PostInteractionSettingsFormProps & {
	handle: WebDialog.DialogHandle;
}) {
	return (
		<WebDialog.Root
			handle={handle}
			onOpenChange={(open, details) => {
				// preserve the old `preventDismiss` while there are unsaved changes pending a persist
				if (!open && rest.isDirty && rest.persist && details.reason !== 'imperative-action') {
					details.cancel();
				}
			}}
		>
			<DialogInner {...rest} />
		</WebDialog.Root>
	);
}

function DialogInner(props: PostInteractionSettingsFormProps) {
	const { t: l } = useLingui();

	return (
		<WebDialog.Popup label={l`Edit post interaction settings`} size="narrow">
			<WebDialog.Close />
			<Header />
			<PostInteractionSettingsForm {...props} />
		</WebDialog.Popup>
	);
}

export type PostInteractionSettingsDialogProps = {
	handle: WebDialog.DialogHandle;
	/** URI of the post to edit the interaction settings for. Could be a root post or could be a reply. */
	postUri: string;
	/**
	 * The URI of the root post in the thread. Used to determine if the viewer owns the threadgate record and
	 * can therefore edit it.
	 */
	rootPostUri: string;
	/**
	 * Optional initial {@link AppBskyFeedDefs.ThreadgateView} to use if we happen to have one before opening the
	 * settings dialog.
	 */
	initialThreadgateView?: AppBskyFeedDefs.ThreadgateView;
};

/** Threadgate settings dialog. Used in the thread. */
export function PostInteractionSettingsDialog({ handle, ...props }: PostInteractionSettingsDialogProps) {
	const { t: l } = useLingui();
	return (
		<WebDialog.Root handle={handle}>
			<WebDialog.Popup label={l`Edit post interaction settings`} size="narrow">
				<WebDialog.Close />
				<PostInteractionSettingsDialogInner handle={handle} {...props} />
			</WebDialog.Popup>
		</WebDialog.Root>
	);
}

function PostInteractionSettingsDialogInner({ handle, ...props }: PostInteractionSettingsDialogProps) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const [isSaving, setIsSaving] = useState(false);

	const { data: threadgateViewLoaded, isLoading: isLoadingThreadgate } = useThreadgateViewQuery({
		postUri: props.rootPostUri,
	});
	const { data: postgate, isLoading: isLoadingPostgate } = usePostgateQuery({
		postUri: props.postUri,
	});

	const { mutateAsync: writePostgateRecord } = useWritePostgateMutation();
	const { mutateAsync: setThreadgateAllow } = useSetThreadgateAllowMutation();

	const [editedPostgate, setEditedPostgate] = useState<AppBskyFeedPostgate.Main>();
	const [editedAllowUISettings, setEditedAllowUISettings] = useState<ThreadgateAllowUISetting[]>();

	const isLoading = isLoadingThreadgate || isLoadingPostgate;
	const threadgateView = threadgateViewLoaded || props.initialThreadgateView;
	const isThreadgateOwnedByViewer = useMemo(() => {
		return currentAccount?.did === parseCanonicalResourceUri(props.rootPostUri).repo;
	}, [props.rootPostUri, currentAccount?.did]);

	const postgateValue = useMemo(() => {
		return editedPostgate || postgate || createPostgateRecord({ post: props.postUri as ResourceUri });
	}, [postgate, editedPostgate, props.postUri]);
	const allowUIValue = useMemo(() => {
		return editedAllowUISettings || threadgateViewToAllowUISetting(threadgateView);
	}, [threadgateView, editedAllowUISettings]);

	const onSave = useCallback(async () => {
		if (!editedPostgate && !editedAllowUISettings) {
			handle.close();
			return;
		}

		setIsSaving(true);

		try {
			const requests = [];

			if (editedPostgate) {
				requests.push(
					writePostgateRecord({
						postUri: props.postUri,
						postgate: editedPostgate,
					}),
				);
			}

			if (editedAllowUISettings && isThreadgateOwnedByViewer) {
				requests.push(
					setThreadgateAllow({
						postUri: props.rootPostUri,
						allow: editedAllowUISettings,
					}),
				);
			}

			await Promise.all(requests);

			handle.close();
		} catch (e) {
			logger.error(`Failed to save post interaction settings`, {
				source: 'PostInteractionSettingsDialogInner',
				safeMessage: e instanceof Error ? e.message : String(e),
			});
			Toast.show(l`There was an issue. Please check your internet connection and try again.`, {
				type: 'error',
			});
		} finally {
			setIsSaving(false);
		}
	}, [
		l,
		handle,
		props.postUri,
		props.rootPostUri,
		editedPostgate,
		editedAllowUISettings,
		writePostgateRecord,
		setThreadgateAllow,
		isThreadgateOwnedByViewer,
	]);

	if (isLoading) {
		return (
			<div className={styles.loading}>
				<Spinner color="currentColor" label={l`Loading post interaction settings...`} />
				<Text className={styles.loadingText}>
					<Trans>Loading post interaction settings...</Trans>
				</Text>
			</div>
		);
	}

	return (
		<>
			<Header />
			<PostInteractionSettingsForm
				replySettingsDisabled={!isThreadgateOwnedByViewer}
				isSaving={isSaving}
				onSave={() => void onSave()}
				postgate={postgateValue}
				onChangePostgate={setEditedPostgate}
				threadgateAllowUISettings={allowUIValue}
				onChangeThreadgateAllowUISettings={setEditedAllowUISettings}
			/>
		</>
	);
}

export function PostInteractionSettingsForm({
	canSave = true,
	onSave,
	isSaving,
	postgate,
	onChangePostgate,
	threadgateAllowUISettings,
	onChangeThreadgateAllowUISettings,
	replySettingsDisabled,
	isDirty,
	persist,
	onChangePersist,
}: PostInteractionSettingsFormProps) {
	const { t: l } = useLingui();
	const [showLists, setShowLists] = useState(false);
	const { data: lists, isPending: isListsPending, isError: isListsError } = useMyListsQuery('curate');
	const [quotesEnabled, setQuotesEnabled] = useState(
		!(
			postgate.embeddingRules &&
			postgate.embeddingRules.find((v) => v.$type === embeddingRules.disableRule.$type)
		),
	);

	const onChangeQuotesEnabled = useCallback(
		(enabled: boolean) => {
			setQuotesEnabled(enabled);
			onChangePostgate(
				createPostgateRecord({
					...postgate,
					embeddingRules: (enabled
						? []
						: [embeddingRules.disableRule]) as AppBskyFeedPostgate.Main['embeddingRules'],
				}),
			);
		},
		[setQuotesEnabled, postgate, onChangePostgate],
	);

	const noOneCanReply = !!threadgateAllowUISettings.find((v) => v.type === 'nobody');
	const everyoneCanReply = !!threadgateAllowUISettings.find((v) => v.type === 'everybody');
	const numberOfListsSelected = threadgateAllowUISettings.filter((v) => v.type === 'list').length;

	const toggleGroupValues = ((): string[] => {
		const values: string[] = [];
		for (const setting of threadgateAllowUISettings) {
			switch (setting.type) {
				case 'everybody':
				case 'nobody':
					// no granularity, early return with nothing
					return [];
				case 'followers':
					values.push('followers');
					break;
				case 'following':
					values.push('following');
					break;
				case 'mention':
					values.push('mention');
					break;
				case 'list':
					values.push(`list:${setting.list}`);
					break;
				default:
					break;
			}
		}
		return values;
	})();

	const toggleGroupOnChange = (values: string[]) => {
		const settings: ThreadgateAllowUISetting[] = [];

		if (values.length === 0) {
			settings.push({ type: 'everybody' });
		} else {
			for (const value of values) {
				if (value.startsWith('list:')) {
					const listId = value.slice('list:'.length);
					settings.push({ type: 'list', list: listId });
				} else {
					settings.push({ type: value as 'followers' | 'following' | 'mention' });
				}
			}
		}

		onChangeThreadgateAllowUISettings(settings);
	};

	return (
		<div className={styles.form}>
			<div className={styles.replySection}>
				{replySettingsDisabled && (
					<div className={styles.disabledNotice}>
						<CircleInfo className={styles.disabledNoticeIcon} size="md" fill={colors.textContrastLow} />
						<Text className={styles.flex1} color="textContrastMedium" size="sm">
							<Trans>Reply settings are chosen by the author of the thread</Trans>
						</Text>
					</div>
				)}

				<div className={styles.replyBlock} style={{ opacity: replySettingsDisabled ? 0.3 : 1 }}>
					<Text size="md" weight="medium">
						<Trans>Who can reply</Trans>
					</Text>

					<Toggle.Group
						className={styles.radioRow}
						disabled={replySettingsDisabled}
						label={l`Set who can reply to your post`}
						onChange={(val) => {
							if (val.includes('everyone')) {
								onChangeThreadgateAllowUISettings([{ type: 'everybody' }]);
							} else if (val.includes('nobody')) {
								onChangeThreadgateAllowUISettings([{ type: 'nobody' }]);
							} else {
								onChangeThreadgateAllowUISettings([{ type: 'mention' }]);
							}
						}}
						type="radio"
						values={everyoneCanReply ? ['everyone'] : noOneCanReply ? ['nobody'] : []}
					>
						<Toggle.RadioItem label={l`Allow anyone to reply`} value="everyone">
							<Toggle.Panel>
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>Anyone</Trans>
								</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
						<Toggle.RadioItem label={l`Disable replies entirely`} value="nobody">
							<Toggle.Panel>
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>Nobody</Trans>
								</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
					</Toggle.Group>

					<Toggle.Group
						disabled={replySettingsDisabled}
						label={l`Set precisely which groups of people can reply to your post`}
						onChange={toggleGroupOnChange}
						type="checkbox"
						values={toggleGroupValues}
					>
						<Toggle.PanelGroup>
							<Toggle.Item label={l`Allow your followers to reply`} name="followers">
								<Toggle.Panel adjacent="trailing">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>
										<Trans>Your followers</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={l`Allow people you follow to reply`} name="following">
								<Toggle.Panel adjacent="both">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>
										<Trans>People you follow</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={l`Allow people you mention to reply`} name="mention">
								<Toggle.Panel adjacent="both">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>
										<Trans>People you mention</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>

							<Toggle.Action
								label={showLists ? l`Hide lists` : l`Show lists of users to select from`}
								onClick={() => {
									setShowLists((s) => !s);
								}}
								pressed={showLists}
							>
								<Toggle.Panel active={numberOfListsSelected > 0} adjacent={showLists ? 'both' : 'leading'}>
									<Toggle.PanelText>
										{numberOfListsSelected === 0 ? (
											<Trans>Select from your lists</Trans>
										) : (
											<Trans>
												Select from your lists{' '}
												<span className={styles.listsCount}>
													<Plural value={numberOfListsSelected} other="(# selected)" />
												</span>
											</Trans>
										)}
									</Toggle.PanelText>
									<Toggle.PanelIcon icon={showLists ? ChevronUpIcon : ChevronDownIcon} />
								</Toggle.Panel>
							</Toggle.Action>
							{showLists &&
								(isListsPending ? (
									<Toggle.Panel>
										<Toggle.PanelText>
											<Trans>Loading lists...</Trans>
										</Toggle.PanelText>
									</Toggle.Panel>
								) : isListsError ? (
									<Toggle.Panel>
										<Toggle.PanelText>
											<Trans>An error occurred while loading your lists :/</Trans>
										</Toggle.PanelText>
									</Toggle.Panel>
								) : lists.length === 0 ? (
									<Toggle.Panel>
										<Toggle.PanelText>
											<Trans>You don't have any lists yet.</Trans>
										</Toggle.PanelText>
									</Toggle.Panel>
								) : (
									lists.map((list, i) => (
										<Toggle.Item
											key={list.uri}
											label={l`Allow users in ${list.name} to reply`}
											name={`list:${list.uri}`}
										>
											<Toggle.Panel adjacent={i === lists.length - 1 ? 'leading' : 'both'}>
												<Toggle.CheckboxIndicator />
												<UserAvatar size={24} type="list" avatar={list.avatar} />
												<Toggle.PanelText>{list.name}</Toggle.PanelText>
											</Toggle.Panel>
										</Toggle.Item>
									))
								))}
						</Toggle.PanelGroup>
					</Toggle.Group>
				</div>
			</div>
			<Toggle.Item
				checked={quotesEnabled}
				label={quotesEnabled ? l`Disable quote posts of this post` : l`Enable quote posts of this post`}
				onChange={onChangeQuotesEnabled}
			>
				<Toggle.Panel>
					<Toggle.PanelText icon={QuoteIcon}>
						<Trans>Allow quote posts</Trans>
					</Toggle.PanelText>
					<Toggle.Switch />
				</Toggle.Panel>
			</Toggle.Item>
			{typeof persist !== 'undefined' && (
				<div className={styles.persistRow}>
					{isDirty ? (
						<Toggle.Item
							checked={persist}
							label={l`Save these options for next time`}
							onChange={() => onChangePersist?.(!persist)}
						>
							<Toggle.CheckboxIndicator />
							<Text size="md">
								<Trans>Save these options for next time</Trans>
							</Text>
						</Toggle.Item>
					) : (
						<Text color="textContrastMedium" size="md">
							<Trans>These are your default settings</Trans>
						</Text>
					)}
				</div>
			)}
			<Button
				className={styles.saveButton}
				color="primary"
				disabled={!canSave || isSaving}
				label={l`Save`}
				onClick={onSave}
				size="large"
			>
				<ButtonText>
					<Trans>Save</Trans>
				</ButtonText>
				{isSaving && <Spinner color="currentColor" label={l`Saving`} size="sm" />}
			</Button>
		</div>
	);
}

function Header() {
	return (
		<div className={styles.header}>
			<Text size="_2xl" weight="bold">
				<Trans>Post interaction settings</Trans>
			</Text>
		</div>
	);
}

export function usePrefetchPostInteractionSettings({
	postUri,
	rootPostUri,
}: {
	postUri: string;
	rootPostUri: string;
}) {
	const queryClient = useQueryClient();
	const { appview, pds } = useClients();
	const getPost = useGetPost();

	return useCallback(async () => {
		try {
			await Promise.all([
				queryClient.prefetchQuery({
					queryKey: createPostgateQueryKey(postUri),
					queryFn: () => getPostgateRecord({ appview, pds: pds!, postUri }).then((res) => res ?? null),
					staleTime: STALE.SECONDS.THIRTY,
				}),
				queryClient.prefetchQuery({
					queryKey: createThreadgateViewQueryKey(rootPostUri),
					queryFn: async () => {
						const post = await getPost({ uri: rootPostUri });
						return post.threadgate ?? null;
					},
					staleTime: STALE.SECONDS.THIRTY,
				}),
			]);
		} catch (e) {
			logger.error(`Failed to prefetch post interaction settings`, {
				safeMessage: e instanceof Error ? e.message : String(e),
			});
		}
	}, [queryClient, appview, pds, postUri, rootPostUri, getPost]);
}
