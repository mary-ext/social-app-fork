'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { MouseEvent, ReactNode, Ref } from 'react';

import { clsx } from 'clsx';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { setDrawerOpen } from '#/state/shell/drawer-open';

import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as styles from '#/components/web/Layout/Header.css';

import ArrowLeft from '#/icons/central/ArrowLeft_round_outlined_radius1_stroke2.svg';
import Menu from '#/icons/central/BarsThree_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

export function Outer({
	children,
	noBottomBorder,
	ref,
	sticky = true,
}: {
	children: ReactNode;
	noBottomBorder?: boolean;
	ref?: Ref<HTMLDivElement>;
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

export function Content({ children }: { children?: ReactNode }) {
	return <div className={styles.content}>{children}</div>;
}

export function Slot({ children }: { children?: ReactNode }) {
	return <div className={styles.slot}>{children}</div>;
}

export function TitleText({ children }: { children: ReactNode }) {
	return (
		<Text size="lg" weight="semiBold" numberOfLines={2}>
			{children}
		</Text>
	);
}

export function SubtitleText({ children }: { children: ReactNode }) {
	return (
		<Text size="sm" color="textContrastMedium" numberOfLines={2}>
			{children}
		</Text>
	);
}

type BackButtonProps = {
	className?: string;
	label?: string;
	onClick?: (evt: MouseEvent<HTMLButtonElement>) => void;
	variant?: 'ghost' | 'scrim';
};

/**
 * navigates back, falling back to Home at the root.
 *
 * @param className button class
 * @param label accessible name
 * @param onClick click handler; prevent default to skip navigation
 * @param variant button style
 */
export function BackButton({ className, label, onClick, variant = 'ghost' }: BackButtonProps = {}) {
	const router = useRouter();

	const handleClick = (evt: MouseEvent<HTMLButtonElement>) => {
		onClick?.(evt);
		if (evt.defaultPrevented) {
			return;
		}
		if (router.canGoBack) {
			router.back();
		} else {
			router.navigate({ to: { name: 'Home' } });
		}
	};

	return (
		<Slot>
			<Button
				className={className}
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

const MENU_AVATAR_SIZE = 24;

/** Opens the drawer nav on narrow viewports. */
export function MenuButton() {
	const { gtMobile } = useBreakpoints();

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
				onClick={() => {
					if (document.activeElement instanceof HTMLElement) {
						document.activeElement.blur();
					}
					setDrawerOpen(true);
				}}
			>
				<MenuButtonGlyph />
			</Button>
		</Slot>
	);
}

function MenuButtonGlyph() {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });

	if (!currentAccount) {
		return <ButtonIcon icon={Menu} size="lg" />;
	}

	return (
		<UserAvatar
			avatar={profile?.avatar}
			size={MENU_AVATAR_SIZE}
			type={profile?.associated?.labeler ? 'labeler' : 'user'}
		/>
	);
}
