import {
	type ComponentPropsWithoutRef,
	createContext,
	type ReactNode,
	type Ref,
	type RefObject,
	use,
	useEffect,
	useRef,
} from 'react';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { clsx } from 'clsx';

import * as styles from '#/components/Tabs.css';
import { Text } from '#/components/Text';

const TabsContext = createContext<{ value: string } | null>(null);

/**
 * enables click-and-drag horizontal scrolling for an overflowing container.
 *
 * prevents click actions from triggering if the drag distance exceeds a small threshold.
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
	onValueChange: (value: string) => void;
	ref?: Ref<HTMLDivElement>;
	value: string;
};

export const Root = ({ children, className, onValueChange, ref, value, ...rest }: RootProps) => {
	return (
		<TabsContext value={{ value }}>
			<BaseTabs.Root
				ref={ref}
				value={value}
				// Base UI types a tab value as `any`; this wrapper only ever keys its tabs by string
				onValueChange={(next: string) => onValueChange(next)}
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
		<BaseTabs.Panel value={value} className={clsx(styles.panel, className)} {...rest}>
			{children}
		</BaseTabs.Panel>
	);
};

export type Section<Id extends string> = {
	children: ReactNode;
	id: Id;
	label: string;
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
 * renders a tabbed interface with a sticky tab bar.
 *
 * @param props.sections config array for the tabs and panels
 * @param props.value active tab value
 * @param props.onValueChange callback triggered on tab change
 * @param props.header optional header element rendered above the tab bar
 */
export const Tabs = <Id extends string>({
	header,
	headerOffset = 0,
	onTabReselect,
	onValueChange,
	sections,
	value,
}: TabsProps<Id>) => {
	const rootRef = useRef<HTMLDivElement>(null);

	// a value that no longer matches any section (dynamic tab sets shrink as filters apply) falls back to
	// the first tab, so the bar and panels stay in sync with what's actually selectable
	const active = sections.some((section) => section.id === value) ? value : sections[0]?.id;

	// on switching to another tab, scroll up just enough to unstick the tab bar — bringing the scroll-away
	// header back into view — rather than leaving the bar floating mid-content over a freshly mounted panel
	const unstickTabBar = () => {
		const root = rootRef.current;
		if (!root) {
			return;
		}
		const delta = root.getBoundingClientRect().top - headerOffset;
		if (delta < 0) {
			window.scrollBy({ top: delta });
		}
	};

	return (
		<Root
			ref={rootRef}
			value={active ?? ''}
			onValueChange={(next) => {
				// `Root` is keyed by plain strings; map back to the section that owns the value
				const section = sections.find(({ id }) => id === next);
				if (section) {
					onValueChange(section.id);
				}
				unstickTabBar();
			}}
		>
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
					{section.children}
				</Panel>
			))}
		</Root>
	);
};
