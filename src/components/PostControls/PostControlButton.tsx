import {
	type ComponentType,
	createContext,
	type CSSProperties,
	type MouseEvent,
	type ReactNode,
	type Ref,
	useContext,
} from 'react';
import { clsx } from 'clsx';

import { atoms as a } from '#/alf';

import type { Props as IconProps } from '#/components/icons/common';
import * as styles from '#/components/PostControls/PostControlButton.css';
import { Text } from '#/components/Text';

const PostControlContext = createContext<{ active?: boolean; big?: boolean }>({});
PostControlContext.displayName = 'PostControlContext';

export type PostControlButtonProps = {
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	children: ReactNode;
	active?: boolean;
	/** Color applied when `active`; icon + count inherit it via `currentColor`. */
	activeColor?: string;
	big?: boolean;
	disabled?: boolean;
	onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
	className?: string;
	style?: CSSProperties;
	ref?: Ref<HTMLButtonElement>;
};

/**
 * The post-control action button (web-native): a plain `<button>` that can render standalone (pass `onClick`)
 * or back a `Menu.Trigger render={...}`.
 */
export function PostControlButton({
	active,
	activeColor,
	big,
	children,
	className,
	label,
	onClick,
	style,
	...rest
}: PostControlButtonProps) {
	return (
		// Base UI's `Menu.Trigger render={...}` clones this with its own props (aria/data/handlers/id/ref)
		// merged in, so spread them all onto the button — forwarding only the ref wouldn't open the menu.
		<button
			type="button"
			aria-label={label}
			className={clsx(styles.button, className)}
			style={active && activeColor ? { color: activeColor, ...style } : style}
			onClick={onClick}
			{...rest}
		>
			<PostControlContext.Provider value={{ active, big }}>{children}</PostControlContext.Provider>
		</button>
	);
}

/** An icon sized to the button's density, inheriting the button color via `currentColor`. */
export function PostControlButtonIcon({ icon: Icon }: { icon: ComponentType<IconProps> }) {
	const { big } = useContext(PostControlContext);
	const size = big ? 22 : 18;
	return <Icon width={size} height={size} fill="currentColor" style={a.pointer_events_none} />;
}

/** A count/label beside the icon, inheriting the button color and bolding when active. */
export function PostControlButtonText({ children }: { children: ReactNode }) {
	const { active, big } = useContext(PostControlContext);
	return (
		<Text
			className={styles.text}
			selectable={false}
			size={big ? 'md' : 'md_sub'}
			weight={active ? 'semiBold' : undefined}
		>
			{children}
		</Text>
	);
}
