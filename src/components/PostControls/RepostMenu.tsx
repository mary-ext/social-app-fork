import type { ReactElement } from 'react';

import { useRequireAuth, useSession } from '#/state/session';

import { CloseQuote_Stroke2_Corner1_Rounded as Quote } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import * as Menu from '#/components/Menu';
import { Tooltip } from '#/components/Tooltip';

import { m } from '#/paraglide/messages';

/**
 * The repost/quote menu. The caller supplies the trigger button via `render` so each action-bar size owns its
 * own button chrome. Signed-out viewers get an auth prompt on press instead of the menu — the open is
 * canceled before Base UI acts on it.
 */
export const RepostMenu = ({
	render,
	tooltip,
	isReposted,
	onRepost,
	onQuote,
	embeddingDisabled,
}: {
	render: ReactElement;
	/** Hover/focus hint for the trigger; the tooltip wraps the menu trigger so it survives the menu wiring. */
	tooltip: string;
	isReposted: boolean;
	onRepost: () => void;
	onQuote: () => void;
	embeddingDisabled: boolean;
}) => {
	const { hasSession } = useSession();
	const requireAuth = useRequireAuth();

	return (
		<Menu.Root
			onOpenChange={(open, details) => {
				if (open && !hasSession) {
					details.cancel();
					requireAuth(() => {});
				}
			}}
		>
			<Tooltip label={tooltip}>
				<Menu.Trigger render={render} />
			</Tooltip>
			<Menu.Popup label={m['components.postControls.repost.a11y']()} align="center" minWidth={170}>
				<Menu.Item
					label={
						isReposted
							? m['components.postControls.repost.action.undo']()
							: m['components.postControls.repost.action.repost']()
					}
					onClick={onRepost}
				>
					<Menu.ItemText>
						{isReposted
							? m['components.postControls.repost.action.undo']()
							: m['components.postControls.repost.action.repost']()}
					</Menu.ItemText>
					<Menu.ItemIcon icon={Repost} position="right" />
				</Menu.Item>
				<Menu.Item
					disabled={embeddingDisabled}
					label={embeddingDisabled ? m['components.postControls.quote.disabled']() : m['common.quote.post']()}
					onClick={onQuote}
				>
					<Menu.ItemText>
						{embeddingDisabled ? m['components.postControls.quote.disabled']() : m['common.quote.post']()}
					</Menu.ItemText>
					<Menu.ItemIcon icon={Quote} position="right" />
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
};
