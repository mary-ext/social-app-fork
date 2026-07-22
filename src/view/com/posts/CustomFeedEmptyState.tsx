import { EmptyState } from '#/view/com/util/EmptyState';

import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';

import { m } from '#/paraglide/messages';
import { useNavigate } from '#/routes';

export function CustomFeedEmptyState() {
	const navigate = useNavigate();

	return (
		<EmptyState
			button={{
				color: 'secondary',
				icon: ChevronRightIcon,
				iconPosition: 'right',
				label: m['view.posts.follow.findAccounts'](),
				onPress: () => {
					navigate('Explore', {});
				},
				size: 'large',
				text: m['view.posts.follow.findAccounts'](),
			}}
			icon={MagnifyingGlassIcon}
			message={m['view.posts.feed.empty']()}
		/>
	);
}
