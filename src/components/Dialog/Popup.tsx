'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type ReactNode, type Ref, useRef } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';

import { useVisualViewportVars } from '#/lib/browser/visual-viewport';

import * as styles from '#/components/Dialog/Popup.css';
import { NavigationEnabled } from '#/components/NavigationDisabled';
import { Text } from '#/components/Text';

import TimesIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

type CardProps = {
	children: ReactNode;
	className?: string;
	/** element focused when the dialog closes. `false` leaves focus where it is. */
	finalFocus?: BaseDialog.Popup.Props['finalFocus'];
	/**
	 * defaults to content height. `fixed` (600px) and `tall` (80vh) prevent resizing between loading and
	 * content states. with `scroll="body"`, capped at 80vh on wide screens; ignored below 800px.
	 */
	height?: 'content' | 'fixed' | 'tall';
	/** element focused when the dialog opens. `false` lets the content manage its own focus. */
	initialFocus?: BaseDialog.Popup.Props['initialFocus'];
	/** accessible name when the dialog has no `Title`. */
	label?: string;
	/** `none` drops the card's own padding, for full-bleed content that reapplies padding per-section. */
	padding?: 'default' | 'none';
	/**
	 * `viewport` (default) scrolls the whole card. `body` scrolls its `Body`/`List` child with pinned
	 * `Header`/`Footer` slots. below 800px, `body` fills the visual viewport above the keyboard. provide an
	 * in-card close control: `outer` {@link Close} is hidden below 800px.
	 */
	scroll?: 'body' | 'viewport';
	size?: 'default' | 'medium' | 'narrow' | 'wide' | 'xwide';
};

/**
 * Portalled backdrop + scrollable viewport. Wraps a {@link Card}; use this split form (rather than the bundled
 * {@link Popup}) when you need a viewport-level sibling of the card — e.g. an outer-anchored {@link Close},
 * which must sit outside the card so the card's scale-in transform doesn't capture its `fixed` positioning.
 */
export function Viewport({ children }: { children: ReactNode }) {
	return (
		<BaseDialog.Portal className={styles.portal}>
			<BaseDialog.Backdrop className={styles.backdrop} forceRender onClick={stopPropagation} />
			<BaseDialog.Viewport className={styles.viewport} onClick={stopPropagation}>
				<NavigationEnabled>{children}</NavigationEnabled>
			</BaseDialog.Viewport>
		</BaseDialog.Portal>
	);
}

/**
 * Themed popup card. Put dialog content inside. Wrap in a {@link Viewport}, or use {@link Popup} which bundles
 * both.
 */
export function Card({
	children,
	className,
	finalFocus,
	height = 'content',
	initialFocus,
	label,
	padding = 'default',
	scroll = 'viewport',
	size = 'default',
}: CardProps) {
	const ref = useRef<HTMLDivElement>(null);
	useVisualViewportVars(ref, { enabled: scroll === 'body' });

	return (
		<BaseDialog.Popup
			ref={ref}
			aria-label={label}
			className={clsx(styles.popup({ height, padding, scroll, size }), className)}
			finalFocus={finalFocus}
			initialFocus={initialFocus}
		>
			{children}
		</BaseDialog.Popup>
	);
}

/**
 * Portalled backdrop + scrollable viewport + themed popup card. Put dialog content inside. The common case;
 * reach for {@link Viewport} + {@link Card} directly when you need a viewport-level sibling like an outer
 * {@link Close}.
 */
export function Popup(props: CardProps) {
	return (
		<Viewport>
			<Card {...props} />
		</Viewport>
	);
}

/** Scrollable content region of a `body`-scroll Popup (below a pinned `Header`, above a pinned `Footer`). */
export function Body({
	children,
	className,
	ref,
	...props
}: {
	children: ReactNode;
	className?: string;
	ref?: Ref<HTMLDivElement>;
} & HTMLAttributes<HTMLDivElement>) {
	return (
		<div ref={ref} className={clsx(styles.body, className)} {...props}>
			{children}
		</div>
	);
}

/** Pinned action bar at the bottom of a `body`-scroll Popup. */
export function Footer({ children }: { children: ReactNode }) {
	return <div className={styles.footer}>{children}</div>;
}

/**
 * In-flow header row for a `viewport`-scroll Popup: a {@link Title} beside a trailing {@link Close}. Because
 * the close lives in the row rather than floating, a long title can never slide under it.
 */
export function TitleRow({ children }: { children: ReactNode }) {
	return <div className={styles.titleRow}>{children}</div>;
}

/** Dialog heading. */
export function Title({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<BaseDialog.Title className={clsx(styles.title, className)} render={<Text size="xl" weight="semiBold" />}>
			{children}
		</BaseDialog.Title>
	);
}

/**
 * Action/button row. Author children in reading order (secondary → primary); the layout knobs are orthogonal.
 * `direction` sets the axis — `row` (default), `column`, or `responsive` (a column on narrow screens, a row
 * past 800px). `align` distributes the row — `end` (default) clusters right, `center`, or `between` spreads
 * to the edges — and is inert in a column. `reverse` flips the flow so the last (primary) child leads; on
 * `responsive` it flips only the narrow column phase, hoisting the primary action to the top on mobile.
 */
export function Actions({
	children,
	align = 'end',
	direction = 'row',
	reverse = false,
}: {
	children: ReactNode;
	align?: 'between' | 'center' | 'end';
	direction?: 'column' | 'responsive' | 'row';
	reverse?: boolean;
}) {
	return <div className={styles.actions({ align, direction, reverse })}>{children}</div>;
}

/** Hairline rule between sections. */
export function Divider() {
	return <div className={styles.divider} aria-hidden />;
}

/**
 * close button. `default` sits in a {@link TitleRow}; `floating` sits at the card's top-right corner. `outer`
 * sits at the screen's top-right corner and is hidden below 800px; provide an in-card alternative.
 */
export function Close({ variant }: { variant?: 'default' | 'floating' | 'outer' } = {}) {
	return (
		<BaseDialog.Close aria-label={m['common.a11y.closeDialog']()} className={styles.close({ variant })}>
			<TimesIcon className={styles.timesIcon} />
		</BaseDialog.Close>
	);
}
