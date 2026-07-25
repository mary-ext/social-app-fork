import { clsx } from 'clsx';

import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { Text } from '#/components/Text';
import { ButtonIcon, ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './FollowingEmptyState.css';

export function FollowingEmptyState() {
	return (
		<div className={css.container}>
			<div className={css.iconBox}>
				<MagnifyingGlassIcon fill={colors.textContrastLow} size="3xl" />
			</div>
			<Text align="center" className={css.message} color="textContrastHigh" size="md" weight="medium">
				{m['view.posts.feed.followingEmpty']()}
			</Text>
			<div className={css.buttonWrap}>
				<LinkButton color="secondary" label={m['view.posts.follow.findAccounts']()} size="large" to="/search">
					<ButtonText>{m['view.posts.follow.findAccounts']()}</ButtonText>
					<ButtonIcon icon={ChevronRightIcon} />
				</LinkButton>
			</div>

			<Text
				align="center"
				className={clsx(css.message, css.sectionText)}
				color="textContrastHigh"
				size="md"
				weight="medium"
			>
				{m['view.posts.discover.hint']()}
			</Text>
			<div className={css.buttonWrap}>
				<LinkButton color="secondary" label={m['view.posts.discover.findFeeds']()} size="large" to="/feeds">
					<ButtonText>{m['view.posts.discover.findFeeds']()}</ButtonText>
					<ButtonIcon icon={ChevronRightIcon} />
				</LinkButton>
			</div>
		</div>
	);
}
