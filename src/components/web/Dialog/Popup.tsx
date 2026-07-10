import type { ReactNode } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';

import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import * as styles from '#/components/web/Dialog/Popup.css';

import { m } from '#/paraglide/messages';

// the portalled backdrop/viewport are rendered into `document.body`, but React still routes their
// events up the *component* tree — so a click would bubble into whatever owns the dialog (e.g. the
// `Link` wrapping an external embed) and trigger it. stop it at the portal boundary.
//
// TODO: revisit when we redo router/navigation — the leak stems from a `Link`/`<a>` press handler
// sitting above the portal on the component tree, and this guard may become unnecessary.
const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

type CardProps = {
	children: ReactNode;
	size?: 'default' | 'medium' | 'narrow' | 'wide';
	/** `none` drops the card's own padding, for full-bleed content that reapplies padding per-section. */
	padding?: 'default' | 'none';
	/**
	 * body strategy. `viewport` (default) is a padded card that grows to its content while the viewport
	 * scrolls. `body` is a height-bounded flex column whose `Body`/`List` child scrolls internally, with pinned
	 * `Header`/`Footer` slots.
	 */
	scroll?: 'body' | 'viewport';
	/** `body`-scroll only: lock to max height so it doesn't shrink to fit transient loading/empty states. */
	fullHeight?: boolean;
	className?: string;
	/** Accessible name for the dialog. Redundant when the popup renders a `Title`. */
	label?: string;
};

/**
 * Portalled backdrop + scrollable viewport. Wraps a {@link Card}; use this split form (rather than the bundled
 * {@link Popup}) when you need a viewport-level sibling of the card — e.g. an outer-anchored {@link Close},
 * which must sit outside the card so the card's scale-in transform doesn't capture its `fixed` positioning.
 */
export function Viewport({ children }: { children: ReactNode }) {
	return (
		<BaseDialog.Portal>
			{/* forceRender so a dialog opened inside another dialog (e.g. from the composer) still dims */}
			<BaseDialog.Backdrop className={styles.backdrop} forceRender onClick={stopPropagation} />
			<BaseDialog.Viewport className={styles.viewport} onClick={stopPropagation}>
				{children}
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
	size = 'default',
	padding = 'default',
	scroll = 'viewport',
	fullHeight,
	className,
	label,
}: CardProps) {
	return (
		<BaseDialog.Popup
			aria-label={label}
			className={clsx(styles.popup({ fullHeight, padding, scroll, size }), className)}
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
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>) {
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
export function TitleRow({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(styles.titleRow, className)}>{children}</div>;
}

/**
 * Dialog heading. Renders the accessible title (so `Popup`'s `label` is redundant when this is present) as
 * the standard `xl` semiBold `Text`.
 */
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
 * Close (×) button. `default` is static/in-flow — place it in a {@link TitleRow}. `floating` pins it to the
 * popup's top-right corner (media/full-bleed dialogs with no header row); `outer` pins it to the screen
 * corner outside the card (full-height dialogs like the GIF picker).
 */
export function Close({ variant }: { variant?: 'default' | 'floating' | 'outer' } = {}) {
	return (
		<BaseDialog.Close aria-label={m['common.a11y.closeDialog']()} className={styles.close({ variant })}>
			<TimesIcon size="md" fill="currentColor" />
		</BaseDialog.Close>
	);
}
