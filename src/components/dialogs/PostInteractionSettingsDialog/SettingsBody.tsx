import { type ReactNode, useCallback, useMemo, useState } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedPostgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { usePostgateQuery, useWritePostgateMutation } from '#/state/queries/postgate';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import {
	type ThreadgateAllowUISetting,
	threadgateViewToAllowUISetting,
	useSetThreadgateAllowMutation,
	useThreadgateViewQuery,
} from '#/state/queries/threadgate';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { BackOrCloseButton, createNavigator } from '#/components/Navigator';
import { ListPicker } from '#/components/PostInteractionSettings/ListPicker';
import {
	PostInteractionSettingsForm,
	type PostInteractionSettingsFormProps,
} from '#/components/PostInteractionSettings/SettingsForm';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { SettingsLoading } from './SettingsLoading';

export type PostInteractionSettingsDialogProps = {
	handle: Dialog.DialogHandle;
	/** URI of the post to edit the interaction settings for. Could be a root post or could be a reply. */
	postUri: ResourceUri;
	/**
	 * The URI of the root post in the thread. Used to determine if the viewer owns the threadgate record and
	 * can therefore edit it.
	 */
	rootPostUri: ResourceUri;
	/**
	 * Optional initial {@link AppBskyFeedDefs.ThreadgateView} to use if we happen to have one before opening the
	 * settings dialog.
	 */
	initialThreadgateView?: AppBskyFeedDefs.ThreadgateView;
};

type FlowProps = Omit<PostInteractionSettingsFormProps, 'onOpenLists'> & {
	footer?: ReactNode;
	isSaving: boolean;
	onSave: () => void;
};

type SettingsRoutes = {
	lists: undefined;
	settings: undefined;
};

const SettingsNavigator = createNavigator<SettingsRoutes>();

/** Threadgate settings dialog. Used in the composer. */
export function PostInteractionSettingsControlledDialog({
	handle,
	isDirty,
	persist,
	onChangePersist,
	...rest
}: Omit<FlowProps, 'footer'> & {
	handle: Dialog.DialogHandle;
	isDirty: boolean;
	persist: boolean;
	onChangePersist: (v: boolean) => void;
}) {
	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open, details) => {
				// preserve the old `preventDismiss` while there are unsaved changes pending a persist
				if (!open && isDirty && persist && details.reason !== 'imperative-action') {
					details.cancel();
				}
			}}
		>
			<Dialog.Popup height="fixed" scroll="body" size="medium">
				<SettingsFlow
					{...rest}
					footer={
						isDirty ? (
							<Toggle.Item
								checked={persist}
								label={m['components.dialogs.mutedWord.saveOptions']()}
								onChange={onChangePersist}
							>
								<Toggle.CheckboxIndicator />
								<Text size="md">{m['components.dialogs.mutedWord.saveOptions']()}</Text>
							</Toggle.Item>
						) : (
							<Text color="textContrastMedium" size="md">
								{m['components.dialogs.mutedWord.defaultSettings']()}
							</Text>
						)
					}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export function SettingsBody({ handle, ...props }: PostInteractionSettingsDialogProps) {
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
		return editedPostgate || postgate || createPostgateRecord({ post: props.postUri });
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
			console.error('Failed to save post interaction settings', e);
			Toast.show(m['common.error.issueConnection'](), {
				type: 'error',
			});
		}
		setIsSaving(false);
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
		return <SettingsLoading />;
	}

	return (
		<SettingsFlow
			isSaving={isSaving}
			onChangePostgate={setEditedPostgate}
			onChangeThreadgateAllowUISettings={setEditedAllowUISettings}
			onSave={() => void onSave()}
			postgate={postgateValue}
			replySettingsDisabled={!isThreadgateOwnedByViewer}
			threadgateAllowUISettings={allowUIValue}
		/>
	);
}

function SettingsFlow(props: FlowProps) {
	return (
		<SettingsNavigator.Provider initialRoute={{ name: 'settings' }}>
			<SettingsFlowInner {...props} />
		</SettingsNavigator.Provider>
	);
}

function SettingsFlowInner({ footer, isSaving, onSave, ...form }: FlowProps) {
	const { push, route } = SettingsNavigator.useNavigator();

	switch (route.name) {
		case 'lists': {
			return (
				<>
					<Dialog.Header.Root>
						<BackOrCloseButton />
						<Dialog.Header.Title>{m['components.dialogs.reply.lists']()}</Dialog.Header.Title>
					</Dialog.Header.Root>
					<ListPicker
						onChange={form.onChangeThreadgateAllowUISettings}
						settings={form.threadgateAllowUISettings}
					/>
				</>
			);
		}
		case 'settings': {
			return (
				<>
					<Dialog.Header.Root border="scrolling">
						<BackOrCloseButton />
						<Dialog.Header.Title>{m['components.dialogs.interaction.title']()}</Dialog.Header.Title>
						<Dialog.Header.Actions>
							<Button
								color="primary"
								disabled={isSaving}
								label={m['common.action.save']()}
								onClick={onSave}
								size="small"
							>
								<ButtonText>{m['common.action.save']()}</ButtonText>
								{isSaving && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
							</Button>
						</Dialog.Header.Actions>
					</Dialog.Header.Root>
					<Dialog.Body>
						<PostInteractionSettingsForm {...form} onOpenLists={() => push({ name: 'lists' })} />
					</Dialog.Body>
					{footer && <Dialog.Footer>{footer}</Dialog.Footer>}
				</>
			);
		}
	}
}
