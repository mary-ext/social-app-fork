import { BlankState } from '#/components/BlankState';
import { ButtonIcon, ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function CustomFeedEmptyState() {
	return (
		<BlankState
			actions={
				<LinkButton
					color="secondary"
					label={m['view.posts.follow.findAccounts']()}
					size="small"
					to={{ name: 'Explore' }}
					variant="solid"
				>
					<ButtonText>{m['view.posts.follow.findAccounts']()}</ButtonText>
					<ButtonIcon icon={ChevronRightIcon} />
				</LinkButton>
			}
			icon={MagnifyingGlassIcon}
			message={m['view.posts.feed.empty']()}
		/>
	);
}
