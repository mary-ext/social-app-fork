import { type ComponentType, type ReactNode, useId, useState } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { useLingui } from '@lingui/react/macro';

import type { Props as IconProps } from '#/components/icons/common';
import { ButtonIcon, ButtonText } from '#/components/web/Button';
import * as button from '#/components/web/Button.css';
import { cx } from '#/components/web/cx';
import * as dialogStyles from '#/components/web/Dialog/Dialog.css';
import { useRegisterDialog } from '#/components/web/Dialog/registry';
import * as styles from '#/components/web/Prompt/Prompt.css';

type Color = 'negative' | 'primary' | 'secondary';

export const Trigger = AlertDialog.Trigger;

/** Creates a detached handle to open/close a Prompt imperatively or from a detached Trigger. */
export const createHandle = AlertDialog.createHandle;

/** Component-local prompt handle. */
export function usePromptHandle() {
	const [handle] = useState(createHandle);
	return handle;
}

/** A confirmation dialog (no backdrop/Escape dismissal — an explicit action is required). */
export function Outer({
	children,
	handle,
}: {
	children: ReactNode;
	handle: ReturnType<typeof createHandle>;
}) {
	const id = useId();
	const registerOpen = useRegisterDialog(id, () => handle.close());
	return (
		<AlertDialog.Root handle={handle} onOpenChange={(open) => registerOpen(open)}>
			<AlertDialog.Portal>
				<AlertDialog.Backdrop className={dialogStyles.backdrop} />
				<AlertDialog.Viewport className={dialogStyles.viewport}>
					<AlertDialog.Popup className={styles.popup}>{children}</AlertDialog.Popup>
				</AlertDialog.Viewport>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}

export function TitleText({ children }: { children: ReactNode }) {
	return <AlertDialog.Title className={styles.title}>{children}</AlertDialog.Title>;
}

export function DescriptionText({ children }: { children: ReactNode }) {
	return <AlertDialog.Description className={styles.description}>{children}</AlertDialog.Description>;
}

export function Actions({ children }: { children: ReactNode }) {
	return <div className={styles.actions}>{children}</div>;
}

export function Action({
	onPress,
	color = 'primary',
	cta,
	icon,
	shouldCloseOnPress = true,
}: {
	onPress: () => void;
	color?: Color;
	cta?: string;
	icon?: ComponentType<IconProps>;
	shouldCloseOnPress?: boolean;
}) {
	const { t: l } = useLingui();
	const cls = cx(button.base, button.size.large, button.solid[color]);
	const content = (
		<>
			<ButtonText>{cta ?? l`Confirm`}</ButtonText>
			{icon && <ButtonIcon icon={icon} />}
		</>
	);

	if (!shouldCloseOnPress) {
		return (
			<button type="button" className={cls} onClick={onPress}>
				{content}
			</button>
		);
	}

	return (
		<AlertDialog.Close className={cls} onClick={onPress}>
			{content}
		</AlertDialog.Close>
	);
}

export function Cancel({ cta }: { cta?: string }) {
	const { t: l } = useLingui();
	return (
		<AlertDialog.Close className={cx(button.base, button.size.large, button.solid.secondary)}>
			<ButtonText>{cta ?? l`Cancel`}</ButtonText>
		</AlertDialog.Close>
	);
}

export function Basic({
	handle,
	title,
	description,
	cancelButtonCta,
	confirmButtonCta,
	onConfirm,
	confirmButtonColor,
	showCancel = true,
}: {
	handle: ReturnType<typeof createHandle>;
	title: string;
	description?: string;
	cancelButtonCta?: string;
	confirmButtonCta?: string;
	onConfirm: () => void;
	confirmButtonColor?: Color;
	showCancel?: boolean;
}) {
	return (
		<Outer handle={handle}>
			<TitleText>{title}</TitleText>
			{description && <DescriptionText>{description}</DescriptionText>}
			<Actions>
				<Action onPress={onConfirm} color={confirmButtonColor} cta={confirmButtonCta} />
				{showCancel && <Cancel cta={cancelButtonCta} />}
			</Actions>
		</Outer>
	);
}
