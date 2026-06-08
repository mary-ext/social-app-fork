import { useLingui } from '@lingui/react/macro';

import { useRequireAuth, useSession } from '#/state/session';

import { useTheme } from '#/alf';

import { CloseQuote_Stroke2_Corner1_Rounded as Quote } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import * as Menu from '#/components/web/Menu';

import { PostControlButton, PostControlButtonIcon, PostControlButtonText } from './PostControlButton';
import { useFormatPostStatCount } from './util';

interface Props {
	isReposted: boolean;
	repostCount?: number;
	onRepost: () => void;
	onQuote: () => void;
	big?: boolean;
	embeddingDisabled: boolean;
}

export const RepostButton = ({
	isReposted,
	repostCount,
	onRepost,
	onQuote,
	big,
	embeddingDisabled,
}: Props) => {
	const t = useTheme();
	const { t: l } = useLingui();
	const { hasSession } = useSession();
	const requireAuth = useRequireAuth();
	const formatPostStatCount = useFormatPostStatCount();

	const count =
		typeof repostCount !== 'undefined' && repostCount > 0 ? (
			<PostControlButtonText>{formatPostStatCount(repostCount)}</PostControlButtonText>
		) : null;

	return hasSession ? (
		<Menu.Root>
			<Menu.Trigger
				render={
					<PostControlButton
						label={l`Repost or quote post`}
						active={isReposted}
						activeColor={t.palette.positive_500}
						big={big}
					>
						<PostControlButtonIcon icon={Repost} />
						{count}
					</PostControlButton>
				}
			/>
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
	) : (
		<PostControlButton
			onClick={() => requireAuth(() => {})}
			active={isReposted}
			activeColor={t.palette.positive_500}
			label={l`Repost or quote post`}
			big={big}
		>
			<PostControlButtonIcon icon={Repost} />
			{count}
		</PostControlButton>
	);
};
