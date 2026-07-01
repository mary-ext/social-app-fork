import { useCallback, useMemo, useState } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedPostgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
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

import { Trans } from '#/locale/Trans';

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
import * as Dialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';

import { m } from '#/paraglide/messages';
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
	handle: Dialog.DialogHandle;
}) {
	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open, details) => {
				// preserve the old `preventDismiss` while there are unsaved changes pending a persist
				if (!open && rest.isDirty && rest.persist && details.reason !== 'imperative-action') {
					details.cancel();
				}
			}}
		>
			<DialogInner {...rest} />
		</Dialog.Root>
	);
}

function DialogInner(props: PostInteractionSettingsFormProps) {
	return (
		<Dialog.Popup label={m['components.dialogs.interaction.editTitle']()} size="narrow">
			<Dialog.Close />
			<Header />
			<PostInteractionSettingsForm {...props} />
		</Dialog.Popup>
	);
}

export type PostInteractionSettingsDialogProps = {
	handle: Dialog.DialogHandle;
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
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['components.dialogs.interaction.editTitle']()} size="narrow">
				<Dialog.Close />
				<PostInteractionSettingsDialogInner handle={handle} {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function PostInteractionSettingsDialogInner({ handle, ...props }: PostInteractionSettingsDialogProps) {
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
			Toast.show(m['common.error.issueConnection'](), {
				type: 'error',
			});
		} finally {
			setIsSaving(false);
		}
	}, [
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
				<Spinner color="currentColor" label={m['components.dialogs.interaction.loading']()} />
				<Text className={styles.loadingText}>{m['components.dialogs.interaction.loading']()}</Text>
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
	const [showLists, setShowLists] = useState(false);
	const { data: lists, isPending: isListsPending, isError: isListsError } = useMyListsQuery('curate');
	const [quotesEnabled, setQuotesEnabled] = useState(
		!(
			postgate.embeddingRules &&
			postgate.embeddingRules.find((v) => v.$type === embeddingRules.disableRule.$type)
		),
	);

	const onChangeQuotesEnabled = (enabled: boolean) => {
		setQuotesEnabled(enabled);
		onChangePostgate(
			createPostgateRecord({
				...postgate,
				embeddingRules: (enabled
					? []
					: [embeddingRules.disableRule]) as AppBskyFeedPostgate.Main['embeddingRules'],
			}),
		);
	};

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
						<CircleInfo className={styles.disabledNoticeIcon} size="lg" fill={colors.textContrastLow} />
						<Text className={styles.flex1} color="textContrastMedium" size="sm">
							{m['components.dialogs.reply.authorControlled']()}
						</Text>
					</div>
				)}

				<div className={styles.replyBlock} style={{ opacity: replySettingsDisabled ? 0.3 : 1 }}>
					<Text size="md" weight="medium">
						{m['common.interaction.whoCanReply']()}
					</Text>

					<Toggle.Group
						className={styles.radioRow}
						disabled={replySettingsDisabled}
						label={m['components.dialogs.reply.description']()}
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
						<Toggle.RadioItem label={m['components.dialogs.reply.allowAnyone']()} value="everyone">
							<Toggle.Panel>
								<Toggle.RadioIndicator />
								<Toggle.PanelText>{m['components.dialogs.reply.anyone']()}</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
						<Toggle.RadioItem label={m['components.dialogs.reply.disableAll']()} value="nobody">
							<Toggle.Panel>
								<Toggle.RadioIndicator />
								<Toggle.PanelText>{m['components.dialogs.reply.nobody']()}</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
					</Toggle.Group>

					<Toggle.Group
						disabled={replySettingsDisabled}
						label={m['components.dialogs.reply.advancedDescription']()}
						onChange={toggleGroupOnChange}
						type="checkbox"
						values={toggleGroupValues}
					>
						<Toggle.PanelGroup>
							<Toggle.Item label={m['components.dialogs.reply.allowFollowers']()} name="followers">
								<Toggle.Panel adjacent="trailing">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>{m['components.dialogs.reply.followers']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={m['components.dialogs.reply.allowFollows']()} name="following">
								<Toggle.Panel adjacent="both">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>{m['components.dialogs.reply.peopleYouFollow']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={m['components.dialogs.reply.allowMentions']()} name="mention">
								<Toggle.Panel adjacent="both">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>{m['components.dialogs.reply.peopleYouMention']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>

							<Toggle.Action
								label={
									showLists
										? m['components.dialogs.list.hide']()
										: m['components.dialogs.list.showSelectA11y']()
								}
								onClick={() => {
									setShowLists((s) => !s);
								}}
								pressed={showLists}
							>
								<Toggle.Panel active={numberOfListsSelected > 0} adjacent={showLists ? 'both' : 'leading'}>
									<Toggle.PanelText>
										{numberOfListsSelected === 0 ? (
											m['components.dialogs.list.selectFromYours']()
										) : (
											<Trans
												message={m['components.dialogs.list.selectFromYoursCount']}
												inputs={{ count: numberOfListsSelected }}
												markup={{
													t0: ({ children }) => <span className={styles.listsCount}>{children}</span>,
												}}
											/>
										)}
									</Toggle.PanelText>
									<Toggle.PanelIcon icon={showLists ? ChevronUpIcon : ChevronDownIcon} />
								</Toggle.Panel>
							</Toggle.Action>
							{showLists &&
								(isListsPending ? (
									<Toggle.Panel>
										<Toggle.PanelText>{m['components.dialogs.list.loading']()}</Toggle.PanelText>
									</Toggle.Panel>
								) : isListsError ? (
									<Toggle.Panel>
										<Toggle.PanelText>{m['components.dialogs.list.error.load']()}</Toggle.PanelText>
									</Toggle.Panel>
								) : lists.length === 0 ? (
									<Toggle.Panel>
										<Toggle.PanelText>{m['components.dialogs.list.empty']()}</Toggle.PanelText>
									</Toggle.Panel>
								) : (
									lists.map((list, i) => (
										<Toggle.Item
											key={list.uri}
											label={m['components.dialogs.reply.allowList']({ name: list.name })}
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
				label={
					quotesEnabled
						? m['components.dialogs.interaction.quote.disable']()
						: m['components.dialogs.interaction.quote.enable']()
				}
				onChange={onChangeQuotesEnabled}
			>
				<Toggle.Panel>
					<Toggle.PanelText icon={QuoteIcon}>
						{m['components.dialogs.interaction.quote.allow']()}
					</Toggle.PanelText>
					<Toggle.Switch />
				</Toggle.Panel>
			</Toggle.Item>
			{typeof persist !== 'undefined' && (
				<div className={styles.persistRow}>
					{isDirty ? (
						<Toggle.Item
							checked={persist}
							label={m['components.dialogs.mutedWord.saveOptions']()}
							onChange={() => onChangePersist?.(!persist)}
						>
							<Toggle.CheckboxIndicator />
							<Text size="md">{m['components.dialogs.mutedWord.saveOptions']()}</Text>
						</Toggle.Item>
					) : (
						<Text color="textContrastMedium" size="md">
							{m['components.dialogs.mutedWord.defaultSettings']()}
						</Text>
					)}
				</div>
			)}
			<Button
				className={styles.saveButton}
				color="primary"
				disabled={!canSave || isSaving}
				label={m['common.action.save']()}
				onClick={onSave}
				size="large"
			>
				<ButtonText>{m['common.action.save']()}</ButtonText>
				{isSaving && <Spinner color="currentColor" label={m['common.status.saving']()} size="sm" />}
			</Button>
		</div>
	);
}

function Header() {
	return (
		<div className={styles.header}>
			<Text size="_2xl" weight="bold">
				{m['components.dialogs.interaction.title']()}
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

	return async () => {
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
	};
}
