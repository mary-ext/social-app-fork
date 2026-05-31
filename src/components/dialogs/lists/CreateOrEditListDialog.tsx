import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { type AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type Did, type Handle } from '@atcute/lexicons';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { cleanError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';
import { cleanNewlines, detectFacets, getShortenedLength } from '#/lib/strings/rich-text-facets';
import { richTextToString } from '#/lib/strings/rich-text-helpers';
import { shortenLinks } from '#/lib/strings/rich-text-manip';

import { type ImageMeta } from '#/state/gallery';
import { useListCreateMutation, useListMetadataMutation } from '#/state/queries/list';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { EditableUserAvatar } from '#/view/com/util/UserAvatar';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

const DISPLAY_NAME_MAX_GRAPHEMES = 64;
const DESCRIPTION_MAX_GRAPHEMES = 300;

export type InitialListValues = {
	name?: string;
	description?: string;
	avatar?: string;
};

export function CreateOrEditListDialog({
	control,
	list,
	purpose,
	onSave,
	initialValues,
}: {
	control: Dialog.DialogControlProps;
	list?: AppBskyGraphDefs.ListView;
	purpose?: AppBskyGraphDefs.ListPurpose;
	onSave?: (uri: string) => void;
	initialValues?: InitialListValues;
}) {
	const { t: l } = useLingui();
	const cancelControl = Dialog.useDialogControl();
	const [dirty, setDirty] = useState(false);

	// 'You might lose unsaved changes' warning
	useEffect(() => {
		if (dirty) {
			const abortController = new AbortController();
			const { signal } = abortController;
			window.addEventListener('beforeunload', (evt) => evt.preventDefault(), {
				signal,
			});
			return () => {
				abortController.abort();
			};
		}
	}, [dirty]);

	const onPressCancel = useCallback(() => {
		if (dirty) {
			cancelControl.open();
		} else {
			control.close();
		}
	}, [dirty, control, cancelControl]);

	return (
		<Dialog.Outer
			control={control}
			nativeOptions={{
				preventDismiss: dirty,
				fullHeight: true,
			}}
			testID="createOrEditListDialog"
		>
			<DialogInner
				list={list}
				purpose={purpose}
				onSave={onSave}
				setDirty={setDirty}
				onPressCancel={onPressCancel}
				initialValues={initialValues}
			/>
			<Prompt.Basic
				control={cancelControl}
				title={l`Discard changes?`}
				description={l`Are you sure you want to discard your changes?`}
				onConfirm={() => control.close()}
				confirmButtonCta={l`Discard`}
				confirmButtonColor="negative"
			/>
		</Dialog.Outer>
	);
}

function DialogInner({
	list,
	purpose,
	onSave,
	setDirty,
	onPressCancel,
	initialValues,
}: {
	list?: AppBskyGraphDefs.ListView;
	purpose?: AppBskyGraphDefs.ListPurpose;
	onSave?: (uri: string) => void;
	setDirty: (dirty: boolean) => void;
	onPressCancel: () => void;
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
	const t = useTheme();
	const { appview } = useClients();
	const control = Dialog.useDialogContext();
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

	// When creating with pre-filled values (from starter pack), consider dirty
	// immediately so the Save button is enabled
	const hasInitialValuesForCreate = !list && initialValues != null;
	const dirty =
		hasInitialValuesForCreate ||
		displayName !== initialDisplayName ||
		descriptionText !== initialDescription ||
		listAvatar !== initialAvatar;

	useEffect(() => {
		setDirty(dirty);
	}, [dirty, setDirty]);

	const onSelectNewAvatar = useCallback(
		(img: ImageMeta | null) => {
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
		},
		[setNewListAvatar, setListAvatar, setImageError],
	);

	const onPressSave = useCallback(async () => {
		setImageError('');
		setDisplayNameTooShort(false);
		try {
			if (displayName.length === 0) {
				setDisplayNameTooShort(true);
				return;
			}

			// `detectFacets` only emits mention facets for handles that resolve, so there are no
			// invalid mentions left to strip.
			const richText = shortenLinks(
				await detectFacets(cleanNewlines(descriptionText.trimEnd()), async (handle) => {
					try {
						const res = await ok(
							appview.get('com.atproto.identity.resolveHandle', {
								params: { handle: handle as Handle },
							}),
						);
						return res.did as Did;
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
				control.close(() => onSave?.(list.uri));
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
				control.close(() => onSave?.(uri));
			}
		} catch (e) {
			logger.error('Failed to create/edit list', { message: String(e) });
		}
	}, [
		list,
		createListMutation,
		updateListMutation,
		onSave,
		control,
		displayName,
		descriptionText,
		newListAvatar,
		setImageError,
		activePurpose,
		isCurateList,
		appview,
		l,
	]);

	const displayNameTooLong = isOverMaxGraphemeCount({
		text: displayName,
		maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
	});
	const descriptionTooLong = getShortenedLength(descriptionText) > DESCRIPTION_MAX_GRAPHEMES;

	const cancelButton = useCallback(
		() => (
			<Button
				label={l`Cancel`}
				onPress={onPressCancel}
				size="small"
				color="primary"
				variant="ghost"
				style={[a.rounded_full]}
				testID="editProfileCancelBtn"
			>
				<ButtonText style={[a.text_md]}>
					<Trans>Cancel</Trans>
				</ButtonText>
			</Button>
		),
		[onPressCancel, l],
	);

	const saveButton = useCallback(
		() => (
			<Button
				label={l`Save`}
				onPress={onPressSave}
				disabled={!dirty || isCreatingList || isUpdatingList || displayNameTooLong || descriptionTooLong}
				size="small"
				color="primary"
				variant="ghost"
				style={[a.rounded_full]}
				testID="editProfileSaveBtn"
			>
				<ButtonText style={[a.text_md, !dirty && t.atoms.text_contrast_low]}>
					<Trans>Save</Trans>
				</ButtonText>
				{(isCreatingList || isUpdatingList) && <ButtonIcon icon={Loader} />}
			</Button>
		),
		[l, t, dirty, onPressSave, isCreatingList, isUpdatingList, displayNameTooLong, descriptionTooLong],
	);

	const onChangeDisplayName = useCallback(
		(text: string) => {
			setDisplayName(text);
			if (text.length > 0 && displayNameTooShort) {
				setDisplayNameTooShort(false);
			}
		},
		[displayNameTooShort],
	);

	const onChangeDescription = useCallback((newText: string) => {
		setDescriptionText(newText);
	}, []);

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
		<Dialog.ScrollableInner
			label={title}
			style={[a.overflow_hidden, { maxWidth: 500 }]}
			contentContainerStyle={[a.px_0, a.pt_0]}
			header={
				<Dialog.Header renderLeft={cancelButton} renderRight={saveButton}>
					<Dialog.HeaderText>{title}</Dialog.HeaderText>
				</Dialog.Header>
			}
		>
			{isUpdateListError && <ErrorMessage message={cleanError(updateListError)} />}
			{isCreateListError && <ErrorMessage message={cleanError(createListError)} />}
			{imageError !== '' && <ErrorMessage message={imageError} />}
			<View style={[a.pt_xl, a.px_xl, a.gap_xl]}>
				<View>
					<TextField.LabelText>
						<Trans>List avatar</Trans>
					</TextField.LabelText>
					<View style={[a.align_start]}>
						<EditableUserAvatar
							size={80}
							avatar={listAvatar}
							onSelectNewAvatar={onSelectNewAvatar}
							type="list"
						/>
					</View>
				</View>
				<View>
					<TextField.LabelText>
						<Trans>List name</Trans>
					</TextField.LabelText>
					<TextField.Root isInvalid={displayNameTooLong || displayNameTooShort}>
						<Dialog.Input
							defaultValue={displayName}
							onChangeText={onChangeDisplayName}
							label={l`Name`}
							placeholder={displayNamePlaceholder}
							testID="editListNameInput"
						/>
					</TextField.Root>
					{(displayNameTooLong || displayNameTooShort) && (
						<Text style={[a.text_sm, a.mt_xs, a.font_bold, { color: t.palette.negative_400 }]}>
							{displayNameTooLong ? (
								<Trans>
									List name is too long.{' '}
									<Plural value={DISPLAY_NAME_MAX_GRAPHEMES} other="The maximum number of characters is #." />
								</Trans>
							) : displayNameTooShort ? (
								<Trans>List must have a name.</Trans>
							) : null}
						</Text>
					)}
				</View>

				<View>
					<TextField.LabelText>
						<Trans>List description</Trans>
					</TextField.LabelText>
					<TextField.Root isInvalid={descriptionTooLong}>
						<Dialog.Input
							defaultValue={descriptionText}
							onChangeText={onChangeDescription}
							multiline
							label={l`Description`}
							placeholder={descriptionPlaceholder}
							testID="editListDescriptionInput"
						/>
					</TextField.Root>
					{descriptionTooLong && (
						<Text style={[a.text_sm, a.mt_xs, a.font_bold, { color: t.palette.negative_400 }]}>
							<Trans>
								List description is too long.{' '}
								<Plural value={DESCRIPTION_MAX_GRAPHEMES} other="The maximum number of characters is #." />
							</Trans>
						</Text>
					)}
				</View>
			</View>
		</Dialog.ScrollableInner>
	);
}
