import type { ReactElement } from 'react';
import { useLingui } from '@lingui/react/macro';

import { useRequireAuth, useSession } from '#/state/session';

import { CloseQuote_Stroke2_Corner1_Rounded as Quote } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import * as Menu from '#/components/web/Menu';

/**
 * The repost/quote menu. The caller supplies the trigger button via `render` so each action-bar size owns its
 * own button chrome. Signed-out viewers get an auth prompt on press instead of the menu — the open is
 * canceled before Base UI acts on it.
 */
export const RepostMenu = ({
	render,
	isReposted,
	onRepost,
	onQuote,
	embeddingDisabled,
}: {
	render: ReactElement;
	isReposted: boolean;
	onRepost: () => void;
	onQuote: () => void;
	embeddingDisabled: boolean;
}) => {
	const { t: l } = useLingui();
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
			<Menu.Trigger render={render} />
			<Menu.Popup label={l`Repost or quote post`} align="center" minWidth={170}>
				<Menu.Item
					label={isReposted ? l`Undo repost` : l({ message: `Repost`, context: `action` })}
					onClick={onRepost}
				>
					<Menu.ItemText>
						{isReposted ? l`Undo repost` : l({ message: `Repost`, context: `action` })}
					</Menu.ItemText>
					<Menu.ItemIcon icon={Repost} position="right" />
				</Menu.Item>
				<Menu.Item
					disabled={embeddingDisabled}
					label={embeddingDisabled ? l`Quote posts disabled` : l`Quote post`}
					onClick={onQuote}
				>
					<Menu.ItemText>{embeddingDisabled ? l`Quote posts disabled` : l`Quote post`}</Menu.ItemText>
					<Menu.ItemIcon icon={Quote} position="right" />
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
};
