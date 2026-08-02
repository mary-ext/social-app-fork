import { cloneElement, type MouseEvent, type ReactElement } from 'react';

import { useRequireAuth, useSession } from '#/state/session';

import * as Menu from '#/components/Menu';
import { Tooltip } from '#/components/Tooltip';

import Repost from '#/icons/central/ArrowsRepeatRightLeft_round_outlined_radius1_stroke2.svg';
import Quote from '#/icons/central/CloseQuote2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export const RepostMenu = ({
	render,
	tooltip,
	isReposted,
	onRepost,
	onQuote,
	embeddingDisabled,
}: {
	render: ReactElement<{ onClick?: (e: MouseEvent<HTMLButtonElement>) => void }>;
	tooltip: string;
	isReposted: boolean;
	onRepost: () => void;
	onQuote: () => void;
	embeddingDisabled: boolean;
}) => {
	const { hasSession } = useSession();
	const requireAuth = useRequireAuth();

	// A menu trigger opens on pointerdown; opening the sign-in dialog there lets the trailing
	// pointerup/click register as an outside-press that immediately dismisses it. Signed-out viewers
	// don't need the menu, so wire the button as a plain click handler instead — the dialog then opens
	// at click time, past the pointer sequence that opened it.
	if (!hasSession) {
		return (
			<Tooltip label={tooltip}>{cloneElement(render, { onClick: () => requireAuth(() => {}) })}</Tooltip>
		);
	}

	return (
		<Menu.Root>
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
