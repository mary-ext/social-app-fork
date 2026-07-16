import { useTitle } from '#/lib/hooks/useTitle';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { SearchScreenShell } from '#/screens/Search/Shell';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export const ProfileSearchScreen = () => {
	const { name, q: queryParam = '' } = useParams('ProfileSearch');
	const { currentAccount } = useSession();

	const { data: resolvedDid } = useResolveDidQuery(name);
	const { data: profile } = useProfileQuery({ did: resolvedDid });

	useTitle(
		profile
			? m['screens.profile.search.action.userPosts']({ handle: profile.handle })
			: m['common.action.search'](),
	);

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
