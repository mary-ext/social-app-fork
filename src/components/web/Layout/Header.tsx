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

/**
 * header variant that floats over an arbitrary banner instead of a solid bar. the banner is rendered as-is
 * behind the header, so the caller owns its markup and styling; it is expected to cover the header and the
 * top safe area. the header slots are laid out in a row over the banner and inset below the safe area. not
 * sticky.
 *
 * @param banner element painted behind the header (e.g. an image or a placeholder)
 * @param children header slots ({@link BackButton}, {@link Content}, {@link Slot}, …)
 */
export function OuterOnBanner({ banner, children }: { banner: React.ReactNode; children: React.ReactNode }) {
	return (
		<div className={styles.bannerOuter}>
			{/* header before banner in source so its controls tab first; z-index keeps it painted on top */}
			<div className={styles.bannerHeader}>{children}</div>
			{banner}
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
		<Text size="lg" weight="semiBold" numberOfLines={2}>
			{children}
		</Text>
	);
}

export function SubtitleText({ children }: { children: React.ReactNode }) {
	return (
		<Text size="sm" color="textContrastMedium" numberOfLines={2}>
			{children}
		</Text>
	);
}

type BackButtonProps = {
	label?: string;
	onClick?: (evt: MouseEvent<HTMLButtonElement>) => void;
	/**
	 * visual treatment: `ghost` (default) reads on a solid header bar; `scrim` is a translucent dark pill for a
	 * back button floating over a banner or other media (see {@link OuterOnBanner}).
	 */
	variant?: 'ghost' | 'scrim';
};

/**
 * header's leading back button. by default pops the navigation stack, falling back to Home at the root.
 *
 * @param label accessible name for the button
 * @param onClick custom click handler; call `evt.preventDefault()` to skip the default back navigation
 * @param variant visual treatment; use `scrim` when the button floats over a banner (see
 *   {@link OuterOnBanner})
 */
export function BackButton({ label, onClick, variant = 'ghost' }: BackButtonProps = {}) {
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
				variant={variant}
				color={variant === 'ghost' ? 'secondary' : undefined}
				shape="round"
				onClick={handleClick}
			>
				<ButtonIcon icon={ArrowLeft} size="lg" />
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
				<ButtonIcon icon={Menu} size="lg" />
			</Button>
		</Slot>
	);
}
