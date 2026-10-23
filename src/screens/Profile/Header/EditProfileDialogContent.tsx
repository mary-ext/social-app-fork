import { useEffect, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { MAX_DESCRIPTION, MAX_DISPLAY_NAME } from '#/lib/constants/profile';
import { cleanError } from '#/lib/errors';
import type { ImageMeta } from '#/lib/media/edit-image';
import { getBlobUrl } from '#/lib/utils/blob-url';
import { isOverMaxGraphemeCount, trimText } from '#/lib/utils/text';

import {
	type ProfileImageEdit,
	type ProfileRecordWrite,
	useProfileUpdateMutation,
} from '#/state/queries/profile';

import { ProfileLinksEditor } from '#/features/profile-links/components/ProfileLinksEditor';
import { saveWithProfileLinks } from '#/features/profile-links/queries';
import { linksFromProfileView, sameProfileLinks } from '#/features/profile-links/record';
import type { ProfileLink } from '#/features/profile-links/types';
import { useSimpleVerificationState } from '#/features/verification/verification-state';

import * as Dialog from '#/components/Dialog';
import { EditableBanner } from '#/components/EditableBanner';
import { EditableUserAvatar } from '#/components/EditableUserAvatar';
import { Notice } from '#/components/Notice';
import type * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './EditProfileDialog.css';

/**
 * @param edit the pending change to a profile image
 * @param current the profile's current image URL
 * @returns the URL to display for the edit
 */
const resolveImageUrl = (edit: ProfileImageEdit, current: string | undefined): string | undefined => {
	if (edit === null) {
		return current;
	}

	switch (edit.kind) {
		case 'remove': {
			return undefined;
		}
		case 'replace': {
			return getBlobUrl(edit.image.blob);
		}
	}
};

/**
 * @param img the image picked by the user, or `null` if they removed it
 * @returns the corresponding profile image edit
 */
const toImageEdit = (img: ImageMeta | null): ProfileImageEdit => {
	if (img === null) {
		return { kind: 'remove' };
	}

	return { kind: 'replace', image: img };
};

/**
 * renders the profile editor and reports unsaved changes to its dialog.
 *
 * @param props profile, dialog handles, and dirty-state callback
 * @returns the profile editing form
 */
export const EditProfileDialogContent = ({
	profile,
	handle,
	cancelHandle,
	setDirty,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	handle: Dialog.DialogHandle;
	cancelHandle: Prompt.PromptHandle;
	setDirty: (dirty: boolean) => void;
}) => {
	const verification = useSimpleVerificationState({ profile });
	const {
		mutateAsync: updateProfileMutation,
		error: updateProfileError,
		isError: isUpdateProfileError,
		isPending: isUpdatingProfile,
	} = useProfileUpdateMutation();
	const initialDisplayName = profile.displayName || '';
	const initialDescription = profile.description || '';

	const [banner, setBanner] = useState<ProfileImageEdit>(null);
	const [avatar, setAvatar] = useState<ProfileImageEdit>(null);
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [description, setDescription] = useState(initialDescription);

	const storedLinks = linksFromProfileView(profile.links);
	const [editedLinks, setEditedLinks] = useState<ProfileLink[]>();
	const links = editedLinks ?? storedLinks;
	const linksDirty = !!editedLinks && !sameProfileLinks(editedLinks, storedLinks);

	const dirty =
		banner !== null ||
		avatar !== null ||
		displayName !== initialDisplayName ||
		description !== initialDescription ||
		linksDirty;

	useEffect(() => {
		setDirty(dirty);
	}, [dirty, setDirty]);

	const onRequestClose = () => {
		if (dirty) {
			cancelHandle.open();
		} else {
			handle.close();
		}
	};

	const onSelectNewAvatar = (img: ImageMeta | null) => {
		setAvatar(toImageEdit(img));
	};

	const onSelectNewBanner = (img: ImageMeta | null) => {
		setBanner(toImageEdit(img));
	};

	const displayNameTooLong = isOverMaxGraphemeCount({ text: displayName, maxCount: MAX_DISPLAY_NAME });
	const descriptionTooLong = isOverMaxGraphemeCount({ text: description, maxCount: MAX_DESCRIPTION });

	const updateProfile = (updates: ProfileRecordWrite | Promise<ProfileRecordWrite>) => {
		return updateProfileMutation({ profile, updates, avatarEdit: avatar, bannerEdit: banner });
	};

	const onPressSave = async () => {
		const fields = { displayName: displayName.trim(), description: trimText(description) };
		try {
			if (linksDirty && editedLinks) {
				await saveWithProfileLinks(
					{ did: profile.did, existing: storedLinks, links: editedLinks },
					(pendingRefs) => {
						return updateProfile(
							pendingRefs.then((refs) => {
								return { ...fields, links: refs };
							}),
						);
					},
				);
			} else {
				await updateProfile(fields);
			}
			handle.close();
		} catch (e) {
			console.error('Failed to update user profile', e);
		}
	};

	return (
		<>
			<Dialog.Header.Root border>
				<Dialog.Header.Close onClick={onRequestClose} />
				<Dialog.Header.Title>{m['screens.profile.editProfile.action']()}</Dialog.Header.Title>
				<Dialog.Header.Actions>
					<Button
						color="primary"
						disabled={!dirty || isUpdatingProfile || displayNameTooLong || descriptionTooLong}
						label={m['common.action.save']()}
						onClick={() => void onPressSave()}
						size="small"
					>
						<ButtonText>{m['common.action.save']()}</ButtonText>
						{isUpdatingProfile && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
					</Button>
				</Dialog.Header.Actions>
			</Dialog.Header.Root>

			<Dialog.Body>
				<div className={styles.bannerWrap}>
					<EditableBanner
						banner={resolveImageUrl(banner, profile.banner)}
						onSelectNewBanner={onSelectNewBanner}
					/>
					<div className={styles.avatar}>
						<EditableUserAvatar
							size={80}
							avatar={resolveImageUrl(avatar, profile.avatar)}
							onSelectNewAvatar={onSelectNewAvatar}
						/>
					</div>
				</div>

				<div className={styles.fields}>
					{isUpdateProfileError && <Notice>{cleanError(updateProfileError)}</Notice>}

					<TextField.Root isInvalid={displayNameTooLong}>
						<TextField.LabelText>{m['screens.profile.editProfile.displayName.label']()}</TextField.LabelText>
						<TextField.Input
							value={displayName}
							onChangeText={setDisplayName}
							label={m['screens.profile.editProfile.displayName.label']()}
							placeholder={m['screens.profile.editProfile.displayName.placeholder']()}
						/>
						{displayNameTooLong && (
							<Text size="sm" weight="semiBold" color="negative_400" className={styles.errorText}>
								{m['screens.profile.editProfile.displayName.tooLong']({ max: MAX_DISPLAY_NAME })}
							</Text>
						)}
					</TextField.Root>

					{verification.isVerified &&
						verification.role === 'default' &&
						displayName !== initialDisplayName && (
							<Admonition type="error">
								{m['screens.profile.editProfile.displayName.verificationWarning']()}
							</Admonition>
						)}

					<TextField.Root isInvalid={descriptionTooLong}>
						<TextField.LabelText>{m['common.status.description']()}</TextField.LabelText>
						<TextField.Input
							value={description}
							onChangeText={setDescription}
							multiline
							label={m['common.status.description']()}
							placeholder={m['screens.profile.editProfile.bio.hint']()}
						/>
						{descriptionTooLong && (
							<Text size="sm" weight="semiBold" color="negative_400" className={styles.errorText}>
								{m['screens.profile.editProfile.bio.tooLong']({ max: MAX_DESCRIPTION })}
							</Text>
						)}
					</TextField.Root>

					<ProfileLinksEditor links={links} onChange={setEditedLinks} />
				</div>
			</Dialog.Body>
		</>
	);
};
