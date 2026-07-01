import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { SearchScreenShell } from '#/screens/Search/Shell';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileSearch'>;
export const ProfileSearchScreen = ({ route }: Props) => {
	const { name, q: queryParam = '' } = route.params;
	const { currentAccount } = useSession();

	const { data: resolvedDid } = useResolveDidQuery(name);
	const { data: profile } = useProfileQuery({ did: resolvedDid });

	useSetTitle(profile ? m['screens.profile.search.action.userPosts']({ handle: profile.handle }) : undefined);

	const fixedParams = {
		from: profile?.handle ?? name,
	};

	return (
		<SearchScreenShell
			navButton="back"
			inputPlaceholder={
				profile
					? currentAccount?.did === profile.did
						? m['screens.profile.search.action.myPosts']()
						: m['screens.profile.search.action.userPosts']({ handle: profile.handle })
					: m['screens.profile.search.placeholder']()
			}
			fixedParams={fixedParams}
			queryParam={queryParam}
		/>
	);
};
