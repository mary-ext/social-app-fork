import * as TabScroller from '#/components/TabScroller';
import { tabLabel } from '#/components/TabScroller.css';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

/**
 * Horizontally-scrolling row of category pills, scrolling the selected pill into view. Used for the interests
 * picker on the Explore screen and the find-follows flow.
 */
export function InterestTabs({
	disabled,
	gutterWidth = space.lg,
	interests,
	interestsDisplayNames,
	onSelectTab,
	selectedInterest,
}: {
	/** Still allows changing tab, but removes the active state from the selected tab. */
	disabled?: boolean;
	gutterWidth?: number;
	interests: string[];
	interestsDisplayNames: Record<string, string>;
	onSelectTab: (tab: string) => void;
	selectedInterest: string;
}) {
	return (
		<TabScroller.Root activeKey={selectedInterest} gutterWidth={gutterWidth}>
			{interests.map((interest) => {
				const active = interest === selectedInterest && !disabled;
				const displayName = interestsDisplayNames[interest]!;
				return (
					<TabScroller.Tab
						active={active}
						aria-label={
							active
								? m['components.web.category.a11y.active']({ name: displayName })
								: m['components.web.category.a11y.select']({ name: displayName })
						}
						key={interest}
						onClick={() => onSelectTab(interest)}
					>
						<Text className={tabLabel} size="md_sub" weight="medium">
							{displayName}
						</Text>
					</TabScroller.Tab>
				);
			})}
		</TabScroller.Root>
	);
}
