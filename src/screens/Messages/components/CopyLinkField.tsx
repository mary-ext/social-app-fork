import { SquareBehindSquare_Stroke2_Corner2_Rounded as CopyIcon } from '#/components/icons/SquareBehindSquare4';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './CopyLinkField.css';

/**
 * read-only {@link TextField.Input} displaying `value`, with a trailing button nested inside the field that
 * copies it to the clipboard and shows a confirmation toast.
 */
export function CopyLinkField({
	disabled,
	label,
	value,
}: {
	disabled?: boolean;
	/** Accessible name for the read-only field. */
	label: string;
	value: string;
}) {
	const onCopy = () => {
		void navigator.clipboard.writeText(value);
		Toast.show(m['screens.messages.inviteLink.copiedToast']());
	};

	return (
		<div className={styles.root}>
			<TextField.Input className={styles.input} disabled={disabled} label={label} readOnly value={value} />
			<Button
				className={styles.button}
				color="secondary"
				disabled={disabled}
				label={m['common.share.action.copyLink']()}
				onClick={onCopy}
				shape="round"
				size="small"
				variant="ghost"
			>
				<ButtonIcon icon={CopyIcon} size="md" />
			</Button>
		</div>
	);
}
