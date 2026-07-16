import type { AnchorHTMLAttributes, MouseEvent, ReactElement } from 'react';

import { useRouter } from './hooks.ts';

/** properties for the link component. */
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	/** replace the current history entry. */
	readonly replace?: boolean;
	/** target relative URL path. */
	readonly to: string;
}

const isModifiedClick = (event: MouseEvent): boolean =>
	event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

// parsing first prevents external URLs from being reduced to local paths.
const isRoutable = (to: string): boolean => {
	try {
		return new URL(to, window.location.href).origin === window.location.origin;
	} catch {
		return false;
	}
};

/**
 * anchor element that intercepts clicks for in-app navigation.
 *
 * a destination on another origin, or under a scheme like `mailto:`, is left to the browser.
 *
 * @param props link properties
 * @returns rendered anchor element
 */
export const Link = ({ children, onClick, replace, to, ...rest }: LinkProps): ReactElement => {
	const router = useRouter();
	return (
		<a
			href={to}
			onClick={(event) => {
				onClick?.(event);
				if (
					event.defaultPrevented ||
					isModifiedClick(event) ||
					rest.download !== undefined ||
					(rest.target !== undefined && rest.target !== '' && rest.target !== '_self') ||
					!isRoutable(to)
				) {
					return;
				}
				event.preventDefault();
				if (replace) {
					router.replace(to);
				} else {
					router.push(to);
				}
			}}
			{...rest}
		>
			{children}
		</a>
	);
};
