import { useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
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

export function BackButton() {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();

	const onClick = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	}, [navigation]);

	return (
		<Slot>
			<Button
				label={l`Go back`}
				variant="ghost"
				color="secondary"
				shape="round"
				className={styles.edgeButton}
				onClick={onClick}
			>
				<ButtonIcon icon={ArrowLeft} size="lg" />
			</Button>
		</Slot>
	);
}

/** Opens the drawer nav on narrow viewports; renders nothing once the side nav takes over. */
export function MenuButton() {
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();
	const setDrawerOpen = useSetDrawerOpen();

	const onClick = useCallback(() => {
		(document.activeElement as HTMLElement | null)?.blur();
		setDrawerOpen(true);
	}, [setDrawerOpen]);

	if (gtMobile) {
		return null;
	}

	return (
		<Slot>
			<Button
				label={l`Open drawer menu`}
				variant="ghost"
				color="secondary"
				shape="round"
				className={styles.edgeButton}
				onClick={onClick}
			>
				<ButtonIcon icon={Menu} size="lg" />
			</Button>
		</Slot>
	);
}
