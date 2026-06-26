import type { ReactNode } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '#/components/icons/Times';
import * as styles from '#/components/web/Dialog/Popup.css';

// the portalled backdrop/viewport are rendered into `document.body`, but React still routes their
// events up the *component* tree — so a click would bubble into whatever owns the dialog (e.g. the
// `Link` wrapping an external embed) and trigger it. stop it at the portal boundary.
//
// TODO: revisit when we redo router/navigation — the leak stems from a `Link`/`<a>` press handler
// sitting above the portal on the component tree, and this guard may become unnecessary.
const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

/** Portalled backdrop + scrollable viewport + themed popup card. Put dialog content inside. */
export function Popup({
	children,
	size = 'default',
	scroll = 'viewport',
	fullHeight,
	outerClose,
	className,
	label,
}: {
	children: ReactNode;
	size?: 'default' | 'narrow';
	/**
	 * Body strategy. `viewport` (default): a padded card that grows to its content while the viewport scrolls.
	 * `body`: a height-bounded flex column whose `Body`/`List` child scrolls internally, with pinned
	 * `Header`/`Footer` slots.
	 */
	scroll?: 'body' | 'viewport';
	/** `body`-scroll only: lock to max height so it doesn't shrink to fit transient loading/empty states. */
	fullHeight?: boolean;
	/** Render the close button at the screen corner (outside the popup) — for full-height dialogs. */
	outerClose?: boolean;
	className?: string;
	/** Accessible name for the dialog. */
	label?: string;
}) {
	return (
		<BaseDialog.Portal>
			{/* forceRender so a dialog opened inside another dialog (e.g. from the composer) still dims */}
			<BaseDialog.Backdrop className={styles.backdrop} forceRender onClick={stopPropagation} />
			<BaseDialog.Viewport className={styles.viewport} onClick={stopPropagation}>
				{outerClose && <Close outer />}
				<BaseDialog.Popup
					aria-label={label}
					className={clsx(styles.popup({ fullHeight, scroll, size }), className)}
				>
					{children}
				</BaseDialog.Popup>
			</BaseDialog.Viewport>
		</BaseDialog.Portal>
	);
}

/** Scrollable content region of a `body`-scroll Popup (below a pinned `Header`, above a pinned `Footer`). */
export function Body({ children }: { children: ReactNode }) {
	return <div className={styles.body}>{children}</div>;
}

/** Pinned action bar at the bottom of a `body`-scroll Popup. */
export function Footer({ children }: { children: ReactNode }) {
	return <div className={styles.footer}>{children}</div>;
}

/** Close (×) button. Defaults to the popup's top-right corner; `outer` pins it to the screen corner. */
export function Close({ outer }: { outer?: boolean } = {}) {
	const { t: l } = useLingui();
	return (
		<BaseDialog.Close aria-label={l`Close dialog`} className={clsx(styles.close, outer && styles.closeOuter)}>
			{/* 18px is the button-icon `md` size, which differs from the raw icon `md` (20px) */}
			<TimesIcon width={18} height={18} fill="currentColor" />
		</BaseDialog.Close>
	);
}
