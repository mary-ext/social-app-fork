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
	interests,
	interestsDisplayNames,
	onSelectTab,
	selectedInterest,
}: {
	interests: string[];
	interestsDisplayNames: Record<string, string>;
	onSelectTab: (tab: string) => void;
	selectedInterest: string;
}) {
	return (
		<TabScroller.Root activeKey={selectedInterest} gutterWidth={space.lg}>
			{interests.map((interest) => {
				const active = interest === selectedInterest;
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
