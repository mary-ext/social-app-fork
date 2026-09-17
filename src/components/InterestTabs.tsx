import * as TabScroller from '#/components/TabScroller';

import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

/**
 * horizontally scrollable interest pills.
 *
 * @param props interests, display names, and selection handler and state
 * @returns selectable interest pills
 */
export function InterestTabs({
	interests,
	interestsDisplayNames,
	onSelectTab,
	selectedInterest,
}: {
	interests: string[];
	interestsDisplayNames: Record<string, () => string>;
	onSelectTab: (tab: string) => void;
	selectedInterest: string;
}) {
	return (
		<TabScroller.Root gutterWidth={space.lg}>
			{interests.map((interest) => {
				const active = interest === selectedInterest;
				const displayName = interestsDisplayNames[interest]!();
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
						<TabScroller.TabText>{displayName}</TabScroller.TabText>
					</TabScroller.Tab>
				);
			})}
		</TabScroller.Root>
	);
}
