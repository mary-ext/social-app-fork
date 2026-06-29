import type { MouseEvent } from 'react';
import { useNavigation } from '@react-navigation/native';
import { clsx } from 'clsx';

import type { NavigationProp } from '#/lib/routes/types';

import { useSetDrawerOpen } from '#/state/shell/drawer-open';

import { useBreakpoints } from '#/alf';

import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft } from '#/components/icons/Arrow';
import { Menu_Stroke2_Corner0_Rounded as Menu } from '#/components/icons/Menu';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as styles from '#/components/web/Layout/Header.css';

import { m } from '#/paraglide/messages';

export function Outer({
	children,
	noBottomBorder,
	ref,
	sticky = true,
}: {
	children: React.ReactNode;
	noBottomBorder?: boolean;
	ref?: React.Ref<HTMLDivElement>;
	sticky?: boolean;
}) {
	return (
		<div
			ref={ref}
			className={clsx(styles.outer, noBottomBorder && styles.outerNoBorder, !sticky && styles.outerStatic)}
		>
			{children}
		</div>
	);
}

export function Content({ children }: { children?: React.ReactNode }) {
	return <div className={styles.content}>{children}</div>;
}

export function Slot({ children }: { children?: React.ReactNode }) {
	return <div className={styles.slot}>{children}</div>;
}

export function TitleText({ children }: { children: React.ReactNode }) {
	return (
		<Text weight="semiBold" numberOfLines={2} className={styles.title}>
			{children}
		</Text>
	);
}

/**
 * The header's leading back button. By default it pops the navigation stack, falling back to Home at the
 * root. Pass `onClick` to run a custom action instead — call `evt.preventDefault()` within it to suppress the
 * default pop (e.g. a logical "back" that stays on the screen).
 *
 * @param label accessible name for the button
 * @param onClick custom click handler; call `evt.preventDefault()` to skip the default back navigation
 */
export function BackButton({
	label,
	onClick,
}: {
	label?: string;
	onClick?: (evt: MouseEvent<HTMLButtonElement>) => void;
} = {}) {
	const navigation = useNavigation<NavigationProp>();

	const handleClick = (evt: MouseEvent<HTMLButtonElement>) => {
		onClick?.(evt);
		if (evt.defaultPrevented) {
			return;
		}
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	};

	return (
		<Slot>
			<Button
				label={label ?? m['common.action.goBack']()}
				variant="ghost"
				color="secondary"
				shape="round"
				onClick={handleClick}
			>
				<ButtonIcon icon={ArrowLeft} size="md" />
			</Button>
		</Slot>
	);
}

/** Opens the drawer nav on narrow viewports; renders nothing once the side nav takes over. */
export function MenuButton() {
	const { gtMobile } = useBreakpoints();
	const setDrawerOpen = useSetDrawerOpen();

	const onClick = () => {
		(document.activeElement as HTMLElement | null)?.blur();
		setDrawerOpen(true);
	};

	if (gtMobile) {
		return null;
	}

	return (
		<Slot>
			<Button
				label={m['common.a11y.openDrawerMenu']()}
				variant="ghost"
				color="secondary"
				shape="round"
				onClick={onClick}
			>
				<ButtonIcon icon={Menu} size="md" />
			</Button>
		</Slot>
	);
}
