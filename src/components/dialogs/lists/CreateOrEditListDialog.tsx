import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Handle } from '@atcute/lexicons';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

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

import * as styles from '#/components/dialogs/lists/CreateOrEditListDialog.css';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { EditableUserAvatar } from '#/components/web/EditableUserAvatar';
import * as Prompt from '#/components/web/Prompt';
import { Text } from '#/components/web/Text';
import * as TextField from '#/components/web/TextField';

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
	const { t: l } = useLingui();
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
				<Dialog.Popup scroll="body" label={l`Create or edit list`}>
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
				title={l`Discard changes?`}
				description={l`Are you sure you want to discard your changes?`}
				onConfirm={() => handle.close()}
				confirmButtonCta={l`Discard`}
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
	const activePurpose = useMemo(() => {
		if (list?.purpose) {
			return list.purpose;
		}
		if (purpose) {
			return purpose;
		}
		return 'app.bsky.graph.defs#curatelist';
	}, [list, purpose]);
	const isCurateList = activePurpose === 'app.bsky.graph.defs#curatelist';

	const { t: l } = useLingui();
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

	const onRequestClose = useCallback(() => {
		if (dirty) {
			cancelHandle.open(null);
		} else {
			handle.close();
		}
	}, [dirty, handle, cancelHandle]);

	const onSelectNewAvatar = useCallback((img: ImageMeta | null) => {
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
	}, []);

	const displayNameTooLong = isOverMaxGraphemeCount({
		text: displayName,
		maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
	});
	const descriptionTooLong = getShortenedLength(descriptionText) > DESCRIPTION_MAX_GRAPHEMES;

	const onPressSave = useCallback(async () => {
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
					try {
						const res = await ok(
							appview.get('com.atproto.identity.resolveHandle', {
								params: { handle: h as Handle },
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
						? l({ message: 'User list updated', context: 'toast' })
						: l({ message: 'Moderation list updated', context: 'toast' }),
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
						? l({ message: 'User list created', context: 'toast' })
						: l({ message: 'Moderation list created', context: 'toast' }),
				);
				handle.close();
				onSave?.(uri);
			}
		} catch (e) {
			logger.error('Failed to create/edit list', { message: String(e) });
		}
	}, [
		list,
		createListMutation,
		updateListMutation,
		onSave,
		handle,
		displayName,
		descriptionText,
		newListAvatar,
		activePurpose,
		isCurateList,
		appview,
		l,
	]);

	const onChangeDisplayName = useCallback(
		(text: string) => {
			setDisplayName(text);
			if (text.length > 0 && displayNameTooShort) {
				setDisplayNameTooShort(false);
			}
		},
		[displayNameTooShort],
	);

	const title = list
		? isCurateList
			? l`Edit user list`
			: l`Edit moderation list`
		: isCurateList
			? l`Create user list`
			: l`Create moderation list`;

	const displayNamePlaceholder = isCurateList ? l`e.g. Great Posters` : l`e.g. Spammers`;

	const descriptionPlaceholder = isCurateList
		? l`e.g. The posters who never miss.`
		: l`e.g. Users that repeatedly reply with ads.`;

	return (
		<>
			<Dialog.Header.Outer>
				<Dialog.Header.Slot>
					<Button label={l`Cancel`} variant="ghost" color="primary" size="small" onClick={onRequestClose}>
						<ButtonText size="md">
							<Trans>Cancel</Trans>
						</ButtonText>
					</Button>
				</Dialog.Header.Slot>
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>{title}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<Button
						label={l`Save`}
						variant="ghost"
						color="primary"
						size="small"
						disabled={!dirty || isCreatingList || isUpdatingList || displayNameTooLong || descriptionTooLong}
						onClick={() => void onPressSave()}
					>
						<ButtonText size="md">
							<Trans>Save</Trans>
						</ButtonText>
						{(isCreatingList || isUpdatingList) && <ButtonIcon icon={Loader} />}
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
						<TextField.LabelText>
							<Trans>List avatar</Trans>
						</TextField.LabelText>
						<div className={styles.avatarWrap}>
							<EditableUserAvatar
								type="list"
								size={80}
								avatar={listAvatar}
								onSelectNewAvatar={onSelectNewAvatar}
							/>
						</div>
					</div>

					<div>
						<TextField.Root isInvalid={displayNameTooLong || displayNameTooShort}>
							<TextField.LabelText>
								<Trans>List name</Trans>
							</TextField.LabelText>
							<TextField.Input
								defaultValue={displayName}
								onChangeText={onChangeDisplayName}
								label={l`Name`}
								placeholder={displayNamePlaceholder}
							/>
						</TextField.Root>
						{(displayNameTooLong || displayNameTooShort) && (
							<Text size="sm" weight="bold" color="negative_400" className={styles.errorText}>
								{displayNameTooLong ? (
									<Trans>
										List name is too long.{' '}
										<Plural
											value={DISPLAY_NAME_MAX_GRAPHEMES}
											other="The maximum number of characters is #."
										/>
									</Trans>
								) : (
									<Trans>List must have a name.</Trans>
								)}
							</Text>
						)}
					</div>

					<div>
						<TextField.Root isInvalid={descriptionTooLong}>
							<TextField.LabelText>
								<Trans>List description</Trans>
							</TextField.LabelText>
							<TextField.Input
								defaultValue={descriptionText}
								onChangeText={setDescriptionText}
								multiline
								label={l`Description`}
								placeholder={descriptionPlaceholder}
							/>
						</TextField.Root>
						{descriptionTooLong && (
							<Text size="sm" weight="bold" color="negative_400" className={styles.errorText}>
								<Trans>
									List description is too long.{' '}
									<Plural value={DESCRIPTION_MAX_GRAPHEMES} other="The maximum number of characters is #." />
								</Trans>
							</Text>
						)}
					</div>
				</div>
			</Dialog.Body>
		</>
	);
}
