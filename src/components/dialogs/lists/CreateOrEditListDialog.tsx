import { useEffect, useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { isHandle } from '@atcute/lexicons/syntax';

import { cleanError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';
import { cleanNewlines, detectFacets, getShortenedLength } from '#/lib/strings/rich-text-facets';
import { richTextToString } from '#/lib/strings/rich-text-helpers';
import { shortenLinks } from '#/lib/strings/rich-text-manip';

import type { ImageMeta } from '#/state/gallery';
import { useListCreateMutation, useListMetadataMutation } from '#/state/queries/list';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';

import * as Dialog from '#/components/Dialog';
import * as styles from '#/components/dialogs/lists/CreateOrEditListDialog.css';
import { EditableUserAvatar } from '#/components/EditableUserAvatar';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

const DISPLAY_NAME_MAX_GRAPHEMES = 64;
const DESCRIPTION_MAX_GRAPHEMES = 300;

export type InitialListValues = {
	name?: string;
	description?: string;
	avatar?: string;
};

export function CreateOrEditListDialog({
	handle,
	list,
	purpose,
	onSave,
	initialValues,
}: {
	handle: Dialog.DialogHandle;
	list?: AppBskyGraphDefs.ListView;
	purpose?: AppBskyGraphDefs.ListPurpose;
	onSave?: (uri: string) => void;
	initialValues?: InitialListValues;
}) {
	const cancelHandle = Prompt.usePromptHandle();
	const [dirty, setDirty] = useState(false);

	// 'You might lose unsaved changes' warning
	useEffect(() => {
		if (dirty) {
			const abortController = new AbortController();
			window.addEventListener('beforeunload', (evt) => evt.preventDefault(), {
				signal: abortController.signal,
			});
			return () => {
				abortController.abort();
			};
		}
	}, [dirty]);

	return (
		<>
			<Dialog.Root
				handle={handle}
				onOpenChange={(open, details) => {
					// guard every non-imperative dismissal while dirty (escape/backdrop, and the focus-out caused
					// by the discard prompt itself) — Save/Discard close imperatively and pass through
					if (!open && dirty && details.reason !== 'imperative-action') {
						details.cancel();
						cancelHandle.open(null);
					}
				}}
			>
				<Dialog.Popup scroll="body">
					<DialogInner
						list={list}
						purpose={purpose}
						onSave={onSave}
						handle={handle}
						cancelHandle={cancelHandle}
						setDirty={setDirty}
						initialValues={initialValues}
					/>
				</Dialog.Popup>
			</Dialog.Root>
			<Prompt.Basic
				handle={cancelHandle}
				title={m['common.discardChanges.title']()}
				description={m['common.discardChanges.message']()}
				onConfirm={() => handle.close()}
				confirmButtonCta={m['common.action.discard']()}
				confirmButtonColor="negative"
			/>
		</>
	);
}

function DialogInner({
	list,
	purpose,
	onSave,
	handle,
	cancelHandle,
	setDirty,
	initialValues,
}: {
	list?: AppBskyGraphDefs.ListView;
	purpose?: AppBskyGraphDefs.ListPurpose;
	onSave?: (uri: string) => void;
	handle: Dialog.DialogHandle;
	cancelHandle: Prompt.PromptHandle;
	setDirty: (dirty: boolean) => void;
	initialValues?: InitialListValues;
}) {
	const activePurpose = list?.purpose || purpose || 'app.bsky.graph.defs#curatelist';
	const isCurateList = activePurpose === 'app.bsky.graph.defs#curatelist';
	const { appview } = useClients();
	const {
		mutateAsync: createListMutation,
		error: createListError,
		isError: isCreateListError,
		isPending: isCreatingList,
	} = useListCreateMutation();
	const {
		mutateAsync: updateListMutation,
		error: updateListError,
		isError: isUpdateListError,
		isPending: isUpdatingList,
	} = useListMetadataMutation();
	const [imageError, setImageError] = useState('');
	const [displayNameTooShort, setDisplayNameTooShort] = useState(false);
	const initialDisplayName = list?.name || initialValues?.name || '';
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const initialDescription = list?.description || initialValues?.description || '';
	const [descriptionText, setDescriptionText] = useState<string>(() => {
		const text = list?.description ?? initialValues?.description;
		const facets = list?.descriptionFacets;

		if (!text || !facets) {
			return text || '';
		}

		// Serialize the stored facets back into editable plain text.
		return richTextToString({ text, facets }, false);
	});

	const initialAvatar = list?.avatar ?? initialValues?.avatar;
	const [listAvatar, setListAvatar] = useState<string | undefined | null>(initialAvatar);
	const [newListAvatar, setNewListAvatar] = useState<ImageMeta | undefined | null>();

	// When creating with pre-filled values (from starter pack), consider dirty immediately so Save is enabled
	const hasInitialValuesForCreate = !list && initialValues != null;
	const dirty =
		hasInitialValuesForCreate ||
		displayName !== initialDisplayName ||
		descriptionText !== initialDescription ||
		listAvatar !== initialAvatar;

	useEffect(() => {
		setDirty(dirty);
	}, [dirty, setDirty]);

	const onRequestClose = () => {
		if (dirty) {
			cancelHandle.open(null);
		} else {
			handle.close();
		}
	};

	const onSelectNewAvatar = (img: ImageMeta | null) => {
		setImageError('');
		if (img === null) {
			setNewListAvatar(null);
			setListAvatar(null);
			return;
		}
		try {
			setNewListAvatar(img);
			setListAvatar(URL.createObjectURL(img.blob));
		} catch (e) {
			setImageError(cleanError(e));
		}
	};

	const displayNameTooLong = isOverMaxGraphemeCount({
		text: displayName,
		maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
	});
	const descriptionTooLong = getShortenedLength(descriptionText) > DESCRIPTION_MAX_GRAPHEMES;

	const onPressSave = async () => {
		setImageError('');
		setDisplayNameTooShort(false);
		try {
			if (displayName.length === 0) {
				setDisplayNameTooShort(true);
				return;
			}

			// `detectFacets` only emits mention facets for handles that resolve, so there are no invalid
			// mentions left to strip.
			const richText = shortenLinks(
				await detectFacets(cleanNewlines(descriptionText.trimEnd()), async (h) => {
					if (!isHandle(h)) {
						return undefined;
					}
					try {
						const res = await ok(
							appview.get('com.atproto.identity.resolveHandle', {
								params: { handle: h },
							}),
						);
						return res.did;
					} catch {
						return undefined;
					}
				}),
			);

			if (list) {
				await updateListMutation({
					uri: list.uri,
					name: displayName,
					description: richText.text,
					descriptionFacets: richText.facets,
					avatar: newListAvatar,
				});
				Toast.show(
					isCurateList
						? m['components.dialogs.list.userUpdatedToast']()
						: m['components.dialogs.list.moderation.updatedToast'](),
				);
				handle.close();
				onSave?.(list.uri);
			} else {
				const { uri } = await createListMutation({
					purpose: activePurpose,
					name: displayName,
					description: richText.text,
					descriptionFacets: richText.facets,
					avatar: newListAvatar,
				});
				Toast.show(
					isCurateList
						? m['components.dialogs.list.userCreatedToast']()
						: m['components.dialogs.list.moderation.createdToast'](),
				);
				handle.close();
				onSave?.(uri);
			}
		} catch (e) {
			logger.error('Failed to create/edit list', { message: String(e) });
		}
	};

	const onChangeDisplayName = (text: string) => {
		setDisplayName(text);
		if (text.length > 0 && displayNameTooShort) {
			setDisplayNameTooShort(false);
		}
	};

	const title = list
		? isCurateList
			? m['components.dialogs.list.editUser']()
			: m['components.dialogs.list.moderation.editTitle']()
		: isCurateList
			? m['components.dialogs.list.createUser']()
			: m['components.dialogs.list.moderation.createTitle']();

	const displayNamePlaceholder = isCurateList
		? m['components.dialogs.list.namePlaceholder']()
		: m['components.dialogs.list.moderation.namePlaceholder']();

	const descriptionPlaceholder = isCurateList
		? m['components.dialogs.list.descriptionPlaceholder']()
		: m['components.dialogs.list.moderation.descriptionPlaceholder']();

	return (
		<>
			<Dialog.Header.Outer>
				<Dialog.Header.Slot>
					<Button
						label={m['common.action.cancel']()}
						variant="ghost"
						color="primary"
						size="small"
						onClick={onRequestClose}
					>
						<ButtonText size="md">{m['common.action.cancel']()}</ButtonText>
					</Button>
				</Dialog.Header.Slot>
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>{title}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<Button
						label={m['common.action.save']()}
						variant="ghost"
						color="primary"
						size="small"
						disabled={!dirty || isCreatingList || isUpdatingList || displayNameTooLong || descriptionTooLong}
						onClick={() => void onPressSave()}
					>
						<ButtonText size="md">{m['common.action.save']()}</ButtonText>
						{(isCreatingList || isUpdatingList) && (
							<Spinner color="white" label={m['common.status.saving']()} size="sm" />
						)}
					</Button>
				</Dialog.Header.Slot>
			</Dialog.Header.Outer>

			<Dialog.Body>
				{isUpdateListError && (
					<div className={styles.errorWrap}>
						<ErrorMessage message={cleanError(updateListError)} />
					</div>
				)}
				{isCreateListError && (
					<div className={styles.errorWrap}>
						<ErrorMessage message={cleanError(createListError)} />
					</div>
				)}
				{imageError !== '' && (
					<div className={styles.errorWrap}>
						<ErrorMessage message={imageError} />
					</div>
				)}

				<div className={styles.fields}>
					<div>
						<TextField.LabelText>{m['components.dialogs.list.avatarAlt']()}</TextField.LabelText>
						<div className={styles.avatarWrap}>
							<EditableUserAvatar
								type="list"
								size={80}
								avatar={listAvatar}
								onSelectNewAvatar={onSelectNewAvatar}
							/>
						</div>
					</div>

					<TextField.Root isInvalid={displayNameTooLong || displayNameTooShort}>
						<TextField.LabelText>{m['components.dialogs.list.nameLabel']()}</TextField.LabelText>
						<TextField.Input
							defaultValue={displayName}
							onChangeText={onChangeDisplayName}
							label={m['components.dialogs.list.name']()}
							placeholder={displayNamePlaceholder}
						/>
						{(displayNameTooLong || displayNameTooShort) && (
							<Text size="sm" weight="bold" color="negative_400" className={styles.errorText}>
								{displayNameTooLong
									? m['components.dialogs.list.error.nameTooLong']({ max: DISPLAY_NAME_MAX_GRAPHEMES })
									: m['components.dialogs.list.error.nameRequired']()}
							</Text>
						)}
					</TextField.Root>

					<TextField.Root isInvalid={descriptionTooLong}>
						<TextField.LabelText>{m['components.dialogs.list.descriptionLabel']()}</TextField.LabelText>
						<TextField.Input
							defaultValue={descriptionText}
							onChangeText={setDescriptionText}
							multiline
							label={m['common.status.description']()}
							placeholder={descriptionPlaceholder}
						/>
						{descriptionTooLong && (
							<Text size="sm" weight="bold" color="negative_400" className={styles.errorText}>
								{m['components.dialogs.list.error.descriptionTooLong']({ max: DESCRIPTION_MAX_GRAPHEMES })}
							</Text>
						)}
					</TextField.Root>
				</div>
			</Dialog.Body>
		</>
	);
}
