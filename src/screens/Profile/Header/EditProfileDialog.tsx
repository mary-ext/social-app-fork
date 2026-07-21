import { useEffect, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { MAX_DESCRIPTION, MAX_DISPLAY_NAME, urls } from '#/lib/constants';
import { cleanError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

import type { ImageMeta } from '#/state/gallery';
import { useProfileUpdateMutation } from '#/state/queries/profile';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';

import * as Dialog from '#/components/Dialog';
import { EditableBanner } from '#/components/EditableBanner';
import { EditableUserAvatar } from '#/components/EditableUserAvatar';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { useSimpleVerificationState } from '#/components/verification';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import { ExternalInlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './EditProfileDialog.css';

export function EditProfileDialog({
	profile,
	handle,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	handle: Dialog.DialogHandle;
}) {
	const cancelHandle = Prompt.usePromptHandle();
	const [dirty, setDirty] = useState(false);

	return (
		<>
			<Dialog.Root
				handle={handle}
				onOpenChange={(open, details) => {
					// guard every non-imperative dismissal while dirty (escape/backdrop, and the focus-out
					// caused by the discard prompt itself) — Save/Discard close imperatively and pass through
					if (!open && dirty && details.reason !== 'imperative-action') {
						details.cancel();
						cancelHandle.open(null);
					}
				}}
			>
				<Dialog.Popup scroll="body">
					<DialogInner profile={profile} handle={handle} cancelHandle={cancelHandle} setDirty={setDirty} />
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
	profile,
	handle,
	cancelHandle,
	setDirty,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	handle: Dialog.DialogHandle;
	cancelHandle: Prompt.PromptHandle;
	setDirty: (dirty: boolean) => void;
}) {
	const verification = useSimpleVerificationState({ profile });
	const {
		mutateAsync: updateProfileMutation,
		error: updateProfileError,
		isError: isUpdateProfileError,
		isPending: isUpdatingProfile,
	} = useProfileUpdateMutation();
	const [imageError, setImageError] = useState('');
	const initialDisplayName = profile.displayName || '';
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const initialDescription = profile.description || '';
	const [description, setDescription] = useState(initialDescription);
	const [userBanner, setUserBanner] = useState<string | undefined | null>(profile.banner);
	const [userAvatar, setUserAvatar] = useState<string | undefined | null>(profile.avatar);
	const [newUserBanner, setNewUserBanner] = useState<ImageMeta | undefined | null>();
	const [newUserAvatar, setNewUserAvatar] = useState<ImageMeta | undefined | null>();

	const dirty =
		displayName !== initialDisplayName ||
		description !== initialDescription ||
		userAvatar !== profile.avatar ||
		userBanner !== profile.banner;

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
			setNewUserAvatar(null);
			setUserAvatar(null);
			return;
		}
		try {
			setNewUserAvatar(img);
			setUserAvatar(URL.createObjectURL(img.blob));
		} catch (e) {
			setImageError(cleanError(e));
		}
	};

	const onSelectNewBanner = (img: ImageMeta | null) => {
		setImageError('');
		if (!img) {
			setNewUserBanner(null);
			setUserBanner(null);
			return;
		}
		try {
			setNewUserBanner(img);
			setUserBanner(URL.createObjectURL(img.blob));
		} catch (e) {
			setImageError(cleanError(e));
		}
	};

	const displayNameTooLong = isOverMaxGraphemeCount({ text: displayName, maxCount: MAX_DISPLAY_NAME });
	const descriptionTooLong = isOverMaxGraphemeCount({ text: description, maxCount: MAX_DESCRIPTION });

	const onPressSave = async () => {
		setImageError('');
		try {
			await updateProfileMutation({
				profile,
				updates: {
					displayName: displayName.trimEnd(),
					description: description.trimEnd(),
				},
				newUserAvatar,
				newUserBanner,
			});
			handle.close();
		} catch (e) {
			logger.error('Failed to update user profile', { message: String(e) });
		}
	};

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
					<Dialog.Header.TitleText>{m['screens.profile.editProfile.action']()}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<Button
						label={m['common.action.save']()}
						variant="ghost"
						color="primary"
						size="small"
						className={!dirty ? styles.inactiveSave : undefined}
						disabled={!dirty || isUpdatingProfile || displayNameTooLong || descriptionTooLong}
						onClick={() => void onPressSave()}
					>
						<ButtonText size="md">{m['common.action.save']()}</ButtonText>
						{isUpdatingProfile && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
					</Button>
				</Dialog.Header.Slot>
			</Dialog.Header.Outer>

			<Dialog.Body>
				<div className={styles.bannerWrap}>
					<EditableBanner banner={userBanner} onSelectNewBanner={onSelectNewBanner} />
					<div className={styles.avatar}>
						<EditableUserAvatar size={80} avatar={userAvatar} onSelectNewAvatar={onSelectNewAvatar} />
					</div>
				</div>

				{isUpdateProfileError && (
					<div className={styles.errorWrap}>
						<ErrorMessage message={cleanError(updateProfileError)} />
					</div>
				)}
				{imageError !== '' && (
					<div className={styles.errorWrap}>
						<ErrorMessage message={imageError} />
					</div>
				)}

				<div className={styles.fields}>
					<TextField.Root isInvalid={displayNameTooLong}>
						<TextField.LabelText>{m['screens.profile.editProfile.displayName.label']()}</TextField.LabelText>
						<TextField.Input
							defaultValue={displayName}
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
								<Trans
									message={m['screens.profile.editProfile.displayName.verificationWarning']}
									markup={{
										t0: ({ children }) => (
											<ExternalInlineLinkText
												href={urls.website.blog.initialVerificationAnnouncement}
												label={m['common.action.learnMore']()}
											>
												{children}
											</ExternalInlineLinkText>
										),
									}}
								/>
							</Admonition>
						)}

					<TextField.Root isInvalid={descriptionTooLong}>
						<TextField.LabelText>{m['common.status.description']()}</TextField.LabelText>
						<TextField.Input
							defaultValue={description}
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
				</div>
			</Dialog.Body>
		</>
	);
}
