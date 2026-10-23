import { MAX_DESCRIPTION } from '#/lib/constants/profile';

import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';

import { m } from '#/paraglide/messages';

import * as styles from './fields.css';

/**
 * multiline bio input.
 *
 * @param props the current value and its validity
 * @returns the description field
 */
export const DescriptionField = ({
	value,
	tooLong,
	onChange,
}: {
	value: string;
	tooLong: boolean;
	onChange: (value: string) => void;
}) => {
	return (
		<TextField.Root isInvalid={tooLong}>
			<TextField.LabelText>{m['common.status.description']()}</TextField.LabelText>
			<TextField.Input
				value={value}
				onChangeText={onChange}
				multiline
				label={m['common.status.description']()}
				placeholder={m['screens.profile.editProfile.bio.hint']()}
			/>
			{tooLong && (
				<Text size="sm" weight="semiBold" color="negative_400" className={styles.errorText}>
					{m['screens.profile.editProfile.bio.tooLong']({ max: MAX_DESCRIPTION })}
				</Text>
			)}
		</TextField.Root>
	);
};
