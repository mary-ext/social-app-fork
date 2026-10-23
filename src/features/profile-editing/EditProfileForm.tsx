import { useEffect, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { MAX_DESCRIPTION, MAX_DISPLAY_NAME } from '#/lib/constants/profile';
import { cleanError } from '#/lib/errors';
import { isOverMaxGraphemeCount, trimText } from '#/lib/utils/text';

import { ProfileLinksEditor } from '#/features/profile-links/components/ProfileLinksEditor';
import { linksFromProfileView, sameProfileLinks } from '#/features/profile-links/record';
import type { ProfileLink } from '#/features/profile-links/types';

import * as Dialog from '#/components/Dialog';
import { Notice } from '#/components/Notice';
import type * as Prompt from '#/components/Prompt';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './EditProfileForm.css';
import { DescriptionField } from './fields/DescriptionField';
import { DisplayNameField } from './fields/DisplayNameField';
import { ProfileImagesEditor } from './images/ProfileImagesEditor';
import type { ProfileImageEdit } from './lib/profile-edits';
import { useProfileUpdateMutation } from './lib/use-profile-update';

/**
 * renders the profile editor and reports unsaved changes to its dialog.
 *
 * @param props profile, dialog handles, and dirty-state callback
 * @returns the profile editing form
 */
export const EditProfileForm = ({
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
	const {
		mutateAsync: updateProfile,
		error: updateProfileError,
		isError: isUpdateProfileError,
		isPending: isUpdatingProfile,
	} = useProfileUpdateMutation();
	const initialDisplayName = profile.displayName || '';
	const initialDescription = profile.description || '';

	const [banner, setBanner] = useState<ProfileImageEdit>();
	const [avatar, setAvatar] = useState<ProfileImageEdit>();
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [description, setDescription] = useState(initialDescription);

	const storedLinks = linksFromProfileView(profile.links);
	const [editedLinks, setEditedLinks] = useState<ProfileLink[]>();
	const links = editedLinks ?? storedLinks;
	const changedLinks = editedLinks && !sameProfileLinks(editedLinks, storedLinks) ? editedLinks : undefined;

	const dirty =
		banner !== undefined ||
		avatar !== undefined ||
		displayName !== initialDisplayName ||
		description !== initialDescription ||
		changedLinks !== undefined;

	useEffect(() => {
		setDirty(dirty);
	}, [dirty, setDirty]);

	const displayNameTooLong = isOverMaxGraphemeCount({ text: displayName, maxCount: MAX_DISPLAY_NAME });
	const descriptionTooLong = isOverMaxGraphemeCount({ text: description, maxCount: MAX_DESCRIPTION });

	const onRequestClose = () => {
		if (dirty) {
			cancelHandle.open();
		} else {
			handle.close();
		}
	};

	const onPressSave = async () => {
		try {
			await updateProfile({
				edits: {
					avatar,
					banner,
					description: trimText(description),
					displayName: displayName.trim(),
					links: changedLinks && { existing: storedLinks, next: changedLinks },
				},
				profile,
			});
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
				<ProfileImagesEditor
					currentAvatar={profile.avatar}
					currentBanner={profile.banner}
					avatar={avatar}
					banner={banner}
					onAvatarChange={setAvatar}
					onBannerChange={setBanner}
				/>

				<div className={styles.fields}>
					{isUpdateProfileError && <Notice>{cleanError(updateProfileError)}</Notice>}

					<DisplayNameField
						profile={profile}
						value={displayName}
						tooLong={displayNameTooLong}
						onChange={setDisplayName}
					/>
					<DescriptionField value={description} tooLong={descriptionTooLong} onChange={setDescription} />
					<ProfileLinksEditor links={links} onChange={setEditedLinks} />
				</div>
			</Dialog.Body>
		</>
	);
};
