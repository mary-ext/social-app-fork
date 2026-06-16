import { type ComponentPropsWithoutRef, createContext, type ReactNode, use, useEffect, useRef } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { clsx } from 'clsx';

import * as styles from '#/components/web/Tabs.css';

/**
 * A web-native tabbed pager built on Base UI Tabs, exposed as namespace parts (`import * as Tabs`). Tabs are
 * identified by a stable string id, so the active tab survives the tab set changing (keep `Tab`/`Panel`
 * `value` and React `key` on the same id). Panels stay mounted while hidden (so each page keeps its scroll
 * and query state), and Base UI handles keyboard navigation and ARIA wiring. The list is sticky and scrolls
 * horizontally when its tabs overflow, centering the active tab; its width comes from the shell's center
 * column, so no width wrapper is needed.
 *
 * ```tsx
 * <Tabs.Root value={tab} onValueChange={setTab}>
 * 	{header}
 * 	<Tabs.List>
 * 		<Tabs.Tab value="posts">Posts</Tabs.Tab>
 * 		<Tabs.Tab value="replies">Replies</Tabs.Tab>
 * 	</Tabs.List>
 * 	<Tabs.Panel value="posts">…</Tabs.Panel>
 * 	<Tabs.Panel value="replies">…</Tabs.Panel>
 * </Tabs.Root>;
 * ```
 */
const TabsContext = createContext<{ value: string } | null>(null);

export type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> & {
	value: string;
	onValueChange: (value: string) => void;
};

export const Root = ({ value, onValueChange, className, children, ...rest }: RootProps) => {
	return (
		<TabsContext value={{ value }}>
			<BaseTabs.Root
				value={value}
				onValueChange={(next) => onValueChange(next as string)}
				className={clsx(styles.root, className)}
				{...rest}
			>
				{children}
			</BaseTabs.Root>
		</TabsContext>
	);
};

export type ListProps = ComponentPropsWithoutRef<'div'>;

export const List = ({ className, children, ...rest }: ListProps) => {
	const listRef = useRef<HTMLDivElement>(null);
	const { value } = use(TabsContext)!;

	// when the row overflows, center the active tab in it — scoped to the list's own scrollLeft, since
	// scrollIntoView would also scroll ancestors (e.g. nudge the page vertically). the browser clamps
	// scrollLeft to its range, so the first/last tabs rest against the edge instead of over-scrolling.
	useEffect(() => {
		const list = listRef.current;
		const tab = list?.querySelector('[data-active]');
		if (!list || !tab) {
			return;
		}
		const listRect = list.getBoundingClientRect();
		const tabRect = tab.getBoundingClientRect();
		const dx = tabRect.left + tabRect.width / 2 - (listRect.left + listRect.width / 2);
		if (dx !== 0) {
			list.scrollBy({ behavior: 'smooth', left: dx });
		}
	}, [value]);

	return (
		<BaseTabs.List ref={listRef} className={clsx(styles.list, className)} {...rest}>
			{children}
		</BaseTabs.List>
	);
};

export type TabProps = Omit<ComponentPropsWithoutRef<'button'>, 'value'> & {
	value: string;
	children: ReactNode;
};

export const Tab = ({ value, className, children, ...rest }: TabProps) => {
	return (
		<BaseTabs.Tab value={value} className={clsx(styles.tab, className)} {...rest}>
			{children}
		</BaseTabs.Tab>
	);
};

export type PanelProps = Omit<ComponentPropsWithoutRef<'div'>, 'value'> & {
	value: string;
};

export const Panel = ({ value, className, children, ...rest }: PanelProps) => {
	return (
		<BaseTabs.Panel value={value} keepMounted className={clsx(styles.panel, className)} {...rest}>
			{children}
		</BaseTabs.Panel>
	);
};
