import { useCallback, useEffect, useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { MAX_DESCRIPTION, MAX_DISPLAY_NAME, urls } from '#/lib/constants';
import { cleanError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

import type { ImageMeta } from '#/state/gallery';
import { useProfileUpdateMutation } from '#/state/queries/profile';

import { logger } from '#/logger';

import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';

import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { useSimpleVerificationState } from '#/components/verification';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { EditableAvatar } from '#/components/web/EditableAvatar';
import { EditableBanner } from '#/components/web/EditableBanner';
import * as Prompt from '#/components/web/Prompt';
import * as Sheet from '#/components/web/Sheet';
import { Text } from '#/components/web/Text';
import * as TextField from '#/components/web/TextField';

import * as styles from './EditProfileDialog.css';

export function EditProfileDialog({
	profile,
	handle,
	onUpdate,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	handle: Sheet.SheetHandle;
	onUpdate?: () => void;
}) {
	const { t: l } = useLingui();
	const cancelHandle = Prompt.usePromptHandle();
	const [dirty, setDirty] = useState(false);

	return (
		<>
			<Sheet.Root
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
				<Sheet.Popup label={l`Edit profile`}>
					<DialogInner
						profile={profile}
						handle={handle}
						onUpdate={onUpdate}
						cancelHandle={cancelHandle}
						setDirty={setDirty}
					/>
				</Sheet.Popup>
			</Sheet.Root>
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
	profile,
	handle,
	onUpdate,
	cancelHandle,
	setDirty,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	handle: Sheet.SheetHandle;
	onUpdate?: () => void;
	cancelHandle: Prompt.PromptHandle;
	setDirty: (dirty: boolean) => void;
}) {
	const { t: l } = useLingui();
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
	}, []);

	const onSelectNewBanner = useCallback((img: ImageMeta | null) => {
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
	}, []);

	const displayNameTooLong = isOverMaxGraphemeCount({ text: displayName, maxCount: MAX_DISPLAY_NAME });
	const descriptionTooLong = isOverMaxGraphemeCount({ text: description, maxCount: MAX_DESCRIPTION });

	const onPressSave = useCallback(async () => {
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
			onUpdate?.();
		} catch (e) {
			logger.error('Failed to update user profile', { message: String(e) });
		}
	}, [
		updateProfileMutation,
		profile,
		onUpdate,
		handle,
		displayName,
		description,
		newUserAvatar,
		newUserBanner,
	]);

	return (
		<>
			<Sheet.Header.Outer>
				<Sheet.Header.Slot>
					<Button label={l`Cancel`} variant="ghost" color="primary" size="small" onClick={onRequestClose}>
						<ButtonText size="md">
							<Trans>Cancel</Trans>
						</ButtonText>
					</Button>
				</Sheet.Header.Slot>
				<Sheet.Header.Content>
					<Sheet.Header.TitleText>
						<Trans>Edit profile</Trans>
					</Sheet.Header.TitleText>
				</Sheet.Header.Content>
				<Sheet.Header.Slot>
					<Button
						label={l`Save`}
						variant="ghost"
						color="primary"
						size="small"
						className={!dirty ? styles.inactiveSave : undefined}
						disabled={!dirty || isUpdatingProfile || displayNameTooLong || descriptionTooLong}
						onClick={onPressSave}
					>
						<ButtonText size="md">
							<Trans>Save</Trans>
						</ButtonText>
						{isUpdatingProfile && <ButtonIcon icon={Loader} />}
					</Button>
				</Sheet.Header.Slot>
			</Sheet.Header.Outer>

			<Sheet.Body>
				<div className={styles.bannerWrap}>
					<EditableBanner banner={userBanner} onSelectNewBanner={onSelectNewBanner} />
					<div className={styles.avatar}>
						<EditableAvatar size={80} avatar={userAvatar} onSelectNewAvatar={onSelectNewAvatar} />
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
					<div>
						<TextField.Root isInvalid={displayNameTooLong}>
							<TextField.LabelText>
								<Trans>Display name</Trans>
							</TextField.LabelText>
							<TextField.Input
								defaultValue={displayName}
								onChangeText={setDisplayName}
								label={l`Display name`}
								placeholder={l`e.g. Alice Lastname`}
							/>
						</TextField.Root>
						{displayNameTooLong && (
							<Text size="sm" weight="semiBold" color="negative_400" className={styles.errorText}>
								<Plural
									value={MAX_DISPLAY_NAME}
									other="Display name is too long. The maximum number of characters is #."
								/>
							</Text>
						)}
					</div>

					{verification.isVerified &&
						verification.role === 'default' &&
						displayName !== initialDisplayName && (
							<Admonition type="error">
								<Trans>
									You are verified. You will lose your verification status if you change your display name.{' '}
									<InlineLinkText
										label={l({ message: `Learn more`, context: `english-only-resource` })}
										to={urls.website.blog.initialVerificationAnnouncement}
									>
										<Trans context="english-only-resource">Learn more.</Trans>
									</InlineLinkText>
								</Trans>
							</Admonition>
						)}

					<div>
						<TextField.Root isInvalid={descriptionTooLong}>
							<TextField.LabelText>
								<Trans>Description</Trans>
							</TextField.LabelText>
							<TextField.Input
								defaultValue={description}
								onChangeText={setDescription}
								multiline
								label={l`Description`}
								placeholder={l`Tell us a bit about yourself`}
							/>
						</TextField.Root>
						{descriptionTooLong && (
							<Text size="sm" weight="semiBold" color="negative_400" className={styles.errorText}>
								<Plural
									value={MAX_DESCRIPTION}
									other="Description is too long. The maximum number of characters is #."
								/>
							</Text>
						)}
					</div>
				</div>
			</Sheet.Body>
		</>
	);
}
