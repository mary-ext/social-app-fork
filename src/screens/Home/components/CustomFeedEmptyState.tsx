import { EmptyState } from '#/components/EmptyState';

import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

export function CustomFeedEmptyState() {
	const router = useRouter();

	return (
		<EmptyState
			button={{
				color: 'secondary',
				icon: ChevronRightIcon,
				iconPosition: 'right',
				label: m['view.posts.follow.findAccounts'](),
				onPress: () => {
					router.navigate({ to: { name: 'Explore' } });
				},
				size: 'large',
				text: m['view.posts.follow.findAccounts'](),
			}}
			icon={MagnifyingGlassIcon}
			message={m['view.posts.feed.empty']()}
		/>
	);
}
