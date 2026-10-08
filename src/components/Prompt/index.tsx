'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ComponentType, type ReactNode, type SVGProps, useId } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';

import { useRegisterDialog } from '#/components/Dialog/registry';
import * as AlertDialog from '#/components/primitives/alert-dialog';
import * as styles from '#/components/Prompt/Prompt.css';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

type Color = 'negative' | 'negative_subtle' | 'primary' | 'secondary';

export const Trigger = AlertDialog.Trigger;

/** @returns a handle for imperative control and detached prompt triggers */
export const createHandle = (): PromptHandle => AlertDialog.createHandle();

export type PromptHandle = AlertDialog.Handle;

/** @returns a stable, component-local prompt handle */
export function usePromptHandle(): PromptHandle {
	const handle = useConstant(createHandle);
	return handle;
}

type Size = 'default' | 'wide';

/** themed alert dialog. */
export function Outer({
	children,
	handle,
	size = 'default',
}: {
	children: ReactNode;
	handle: PromptHandle;
	size?: Size;
}) {
	const id = useId();
	const registerOpen = useRegisterDialog(id, () => handle.close());
	return (
		<AlertDialog.Root handle={handle} onOpenChange={(open) => registerOpen(open)}>
			<AlertDialog.Viewport className={styles.viewport}>
				<AlertDialog.Backdrop className={styles.backdrop} />
				<AlertDialog.Popup className={styles.popup({ size })}>{children}</AlertDialog.Popup>
			</AlertDialog.Viewport>
		</AlertDialog.Root>
	);
}

/** Groups the title + description above the actions. */
export function Content({ children }: { children: ReactNode }) {
	return <div className={styles.content}>{children}</div>;
}

export function TitleText({ children }: { children: ReactNode }) {
	return (
		<AlertDialog.Title className={styles.title} render={<Text size="xl" weight="semiBold" />}>
			{children}
		</AlertDialog.Title>
	);
}

export function DescriptionText({ children }: { children: ReactNode }) {
	return (
		<AlertDialog.Description className={styles.description} render={<Text color="textContrastHigh" />}>
			{children}
		</AlertDialog.Description>
	);
}

/** A vertical list of icon + text rows explaining what an action does (the "here's what happens" body). */
export function Rows({ children }: { children: ReactNode }) {
	return <div className={styles.rows}>{children}</div>;
}

/** A single explainer row: a muted leading icon beside its description. */
export function Row({
	children,
	icon: Icon,
}: {
	children: ReactNode;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
	return (
		<div className={styles.row}>
			<Icon className={styles.rowIcon} />
			<Text className={styles.rowText} color="textContrastHigh">
				{children}
			</Text>
		</div>
	);
}

export function Actions({ children }: { children: ReactNode }) {
	return <div className={styles.actions}>{children}</div>;
}

export function Action({
	onPress,
	color = 'primary',
	cta,
	disabled = false,
	icon,
	shouldCloseOnPress = true,
}: {
	onPress: () => void;
	color?: Color;
	cta?: string;
	disabled?: boolean;
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	shouldCloseOnPress?: boolean;
}) {
	const label = cta ?? m['common.action.confirm']();
	const content = (
		<>
			<ButtonText>{label}</ButtonText>
			{icon && <ButtonIcon icon={icon} />}
		</>
	);

	if (!shouldCloseOnPress) {
		return (
			<Button color={color} disabled={disabled} label={label} onClick={onPress} size="large" variant="solid">
				{content}
			</Button>
		);
	}

	return (
		<AlertDialog.Close
			disabled={disabled}
			onClick={onPress}
			render={
				<Button color={color} label={label} size="large" variant="solid">
					{content}
				</Button>
			}
		/>
	);
}

export function Cancel({ cta }: { cta?: string }) {
	const label = cta ?? m['common.action.cancel']();

	return (
		<AlertDialog.Close
			render={
				<Button color="secondary" label={label} size="large" variant="solid">
					<ButtonText>{label}</ButtonText>
				</Button>
			}
		/>
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
	handle: PromptHandle;
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
			<Content>
				<TitleText>{title}</TitleText>
				{description && <DescriptionText>{description}</DescriptionText>}
			</Content>
			<Actions>
				<Action onPress={onConfirm} color={confirmButtonColor} cta={confirmButtonCta} />
				{showCancel && <Cancel cta={cancelButtonCta} />}
			</Actions>
		</Outer>
	);
}
