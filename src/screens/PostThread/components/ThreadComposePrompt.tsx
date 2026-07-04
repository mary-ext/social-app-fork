import { useHideBottomBarBorderForScreen } from '#/lib/hooks/useHideBottomBarBorder';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { useBreakpoints } from '#/alf';

import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

import * as css from './ThreadComposePrompt.css';

export function ThreadComposePrompt({ onPressCompose }: { onPressCompose: () => void }) {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const { gtMobile } = useBreakpoints();

	useHideBottomBarBorderForScreen();

	return (
		<div className={css.outer({ isDesktop: gtMobile })}>
			{!gtMobile && <div className={css.gradient} />}

			<button
				aria-label={m['screens.postThread.reply.a11y.compose']()}
				onClick={onPressCompose}
				className={css.button({ isDesktop: gtMobile })}
			>
				<UserAvatar
					size={24}
					avatar={profile?.avatar}
					type={profile?.associated?.labeler ? 'labeler' : 'user'}
				/>
				<Text size="md" color="textContrastMedium">
					{m['common.compose.replyPlaceholder']()}
				</Text>
			</button>
		</div>
	);
}
