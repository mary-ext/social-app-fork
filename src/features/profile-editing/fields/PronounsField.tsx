import * as pillCss from '#/features/profile-links/components/LinkPill.css';

import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/TextField';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import PencilIcon from '#/icons/central/PencilLine_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './fields.css';
import { PronounsDialog } from './PronounsDialog';

/**
 * pronouns as a pill that opens an editor, so the optional field stays out of the way. matches the link
 * pills.
 *
 * @param props the current value and change callback
 * @returns the pronouns field
 */
export const PronounsField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
	const dialogHandle = Dialog.useDialogHandle();

	return (
		<div className={styles.pronounsSection}>
			<TextField.LabelText>{m['screens.profile.editProfile.pronouns.label']()}</TextField.LabelText>
			<div>
				{value ? (
					<Button
						className={styles.pronounsPill}
						color="secondary"
						label={m['screens.profile.editProfile.pronouns.editA11y']({ pronouns: value })}
						onClick={() => dialogHandle.open()}
						size="small"
					>
						<span className={pillCss.label}>{value}</span>
						<PencilIcon className={pillCss.grip({ support: false })} />
					</Button>
				) : (
					<Button
						className={pillCss.dashedPill}
						color="secondary"
						label={m['screens.profile.editProfile.pronouns.add']()}
						onClick={() => dialogHandle.open()}
						size="small"
						variant="outline"
					>
						<ButtonIcon icon={PlusIcon} />
						<ButtonText>{m['screens.profile.editProfile.pronouns.add']()}</ButtonText>
					</Button>
				)}
			</div>
			<PronounsDialog handle={dialogHandle} onChange={onChange} pronouns={value} />
		</div>
	);
};
