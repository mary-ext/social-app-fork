import type { AppBskyActorDefs } from '@atcute/bluesky';

import { MAX_DISPLAY_NAME } from '#/lib/constants/profile';

import { useSimpleVerificationState } from '#/features/verification/verification-state';

import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Admonition } from '#/components/web/Admonition';

import { m } from '#/paraglide/messages';

import * as styles from './fields.css';

/**
 * display name input, warning verified users that changing it revokes their verification.
 *
 * @param props the profile being edited, the current value, and its validity
 * @returns the display name field
 */
export const DisplayNameField = ({
	profile,
	value,
	tooLong,
	onChange,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	value: string;
	tooLong: boolean;
	onChange: (value: string) => void;
}) => {
	const verification = useSimpleVerificationState({ profile });
	const changed = value !== (profile.displayName || '');

	return (
		<>
			<TextField.Root isInvalid={tooLong}>
				<TextField.LabelText>{m['screens.profile.editProfile.displayName.label']()}</TextField.LabelText>
				<TextField.Input
					value={value}
					onChangeText={onChange}
					label={m['screens.profile.editProfile.displayName.label']()}
					placeholder={m['screens.profile.editProfile.displayName.placeholder']()}
				/>
				{tooLong && (
					<Text size="sm" weight="semiBold" color="negative_400" className={styles.errorText}>
						{m['screens.profile.editProfile.displayName.tooLong']({ max: MAX_DISPLAY_NAME })}
					</Text>
				)}
			</TextField.Root>

			{verification.isVerified && verification.role === 'default' && changed && (
				<Admonition type="error">
					{m['screens.profile.editProfile.displayName.verificationWarning']()}
				</Admonition>
			)}
		</>
	);
};
