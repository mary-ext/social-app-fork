import {
	type ComponentPropsWithoutRef,
	createContext,
	type ReactNode,
	type RefObject,
	use,
	useEffect,
	useRef,
} from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { clsx } from 'clsx';

import { Text } from '#/components/Text';
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

/**
 * Lets the user click and drag horizontally to scroll an overflowing row, since the scrollbar is hidden and a
 * trackpad/shift-wheel isn't always available. A few pixels of slop keep a plain click selecting a tab; once
 * it crosses into a drag, the trailing click is swallowed so it doesn't activate a tab.
 */
const useDragScroll = (ref: RefObject<HTMLElement | null>) => {
	useEffect(() => {
		const row = ref.current;
		if (!row) {
			return;
		}
		let isPressed = false;
		let isDragging = false;
		let startX = 0;
		let startScrollLeft = 0;

		const onMouseDown = (e: MouseEvent) => {
			isPressed = true;
			startX = e.pageX;
			startScrollLeft = row.scrollLeft;
		};
		const onMouseMove = (e: MouseEvent) => {
			if (!isPressed) {
				return;
			}
			const walk = e.pageX - startX;
			if (!isDragging && Math.abs(walk) < 3) {
				return;
			}
			isDragging = true;
			e.preventDefault();
			row.scrollLeft = startScrollLeft - walk;
		};
		const onMouseUp = () => {
			if (isDragging) {
				// the bar sits below React's root click delegation, so stopping the trailing click here keeps
				// the drag from selecting the tab it lands on
				row.addEventListener('click', (e) => e.stopPropagation(), { once: true });
			}
			isPressed = false;
			isDragging = false;
		};

		row.addEventListener('mousedown', onMouseDown);
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
		return () => {
			row.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};
	}, [ref]);
};

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

	useDragScroll(listRef);

	return (
		<BaseTabs.List ref={listRef} className={clsx(styles.list, className)} {...rest}>
			{children}
		</BaseTabs.List>
	);
};

export type TabProps = Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'children'> & {
	value: string;
	label: string;
};

export const Tab = ({ value, className, label, ...rest }: TabProps) => {
	return (
		<BaseTabs.Tab
			value={value}
			className={clsx(styles.tab, className)}
			render={(props, state) => (
				<button {...props}>
					<Text className={styles.tabLabel} color={state.active ? 'text' : 'textContrastMedium'}>
						{label}
					</Text>
				</button>
			)}
			{...rest}
		/>
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

export type Section<Id extends string> = {
	id: Id;
	label: string;
	/**
	 * @param isFocused whether this is the active tab; gate the section's feed query on it so only the visible
	 *   tab fetches while the rest sit mounted-but-idle.
	 */
	render: (isFocused: boolean) => ReactNode;
};

export type TabsProps<Id extends string> = {
	/** Rendered above the tab bar, in flow — it scrolls away while the bar stays sticky. */
	header?: ReactNode;
	/** Sticky offset in px for the tab bar, e.g. the height of a persistent header above it. */
	headerOffset?: number;
	/**
	 * Called when the already-active tab is re-tapped. Defaults to scrolling the page to the top; the feed
	 * screens that own a soft-reset pass that instead.
	 */
	onTabReselect?: (id: Id) => void;
	onValueChange: (value: Id) => void;
	sections: Section<Id>[];
	value: Id;
};

/**
 * The config-driven entry point to the web Tabs primitive: pass a `sections` array plus the controlled
 * `value`/`onValueChange`, and it renders the sticky bar and the keep-mounted panels with the shared chrome
 * (drag-scroll, active-tab centering, scroll-to-top on re-tap, first-tab fallback) built in. For bespoke
 * layouts, compose the lower-level `Root`/`List`/`Tab`/`Panel` parts directly instead.
 *
 * Passing an empty `sections` renders just the `header` with no bar — e.g. while a profile header is still
 * loading and its tab set isn't known yet.
 */
export const Tabs = <Id extends string>({
	header,
	headerOffset = 0,
	onTabReselect,
	onValueChange,
	sections,
	value,
}: TabsProps<Id>) => {
	// a value that no longer matches any section (dynamic tab sets shrink as filters apply) falls back to
	// the first tab, so the bar and panels stay in sync with what's actually selectable
	const active = sections.some((section) => section.id === value) ? value : sections[0]?.id;

	return (
		<Root value={active ?? ''} onValueChange={(next) => onValueChange(next as Id)}>
			{header}
			{sections.length > 0 && (
				<List style={headerOffset ? { top: headerOffset } : undefined}>
					{sections.map((section) => (
						<Tab
							key={section.id}
							label={section.label}
							value={section.id}
							onClick={() => {
								// Base UI's onValueChange doesn't fire when the active tab is re-tapped
								if (active !== section.id) {
									return;
								}
								if (onTabReselect) {
									onTabReselect(section.id);
								} else {
									window.scrollTo(0, 0);
								}
							}}
						/>
					))}
				</List>
			)}
			{sections.map((section) => (
				<Panel key={section.id} value={section.id}>
					{section.render(active === section.id)}
				</Panel>
			))}
		</Root>
	);
};
