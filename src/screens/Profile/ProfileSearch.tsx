import { useTitle } from '#/lib/hooks/useTitle';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { SearchHeader } from '#/screens/Search/SearchHeader';

import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

// a launch point only: it renders the search header and hands actual queries off to the Search screen, with
// the profile baked in as a `from:` filter.
export const ProfileSearchScreen = () => {
	const [{ name }] = useParams('ProfileSearch');
	const { currentAccount } = useSession();

	const { data: resolvedDid } = useResolveDidQuery(name);
	const { data: profile } = useProfileQuery({ did: resolvedDid });

	useTitle(
		profile
			? m['screens.profile.search.action.userPosts']({ handle: profile.handle })
			: m['common.action.search'](),
	);

	const placeholder = profile
		? currentAccount?.did === profile.did
			? m['screens.profile.search.action.myPosts']()
			: m['screens.profile.search.action.userPosts']({ handle: profile.handle })
		: m['screens.profile.search.placeholder']();

	return (
		<Layout.Screen>
			<SearchHeader
				fixedParams={{ from: profile?.handle ?? name }}
				initialQuery=""
				navButton={<Layout.Header.BackButton />}
				placeholder={placeholder}
			/>
		</Layout.Screen>
	);
};
