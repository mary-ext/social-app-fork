import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';

import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { SearchScreenShell } from '#/screens/Search/Shell';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileSearch'>;
export const ProfileSearchScreen = ({ route }: Props) => {
	const { name, q: queryParam = '' } = route.params;
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const { data: resolvedDid } = useResolveDidQuery(name);
	const { data: profile } = useProfileQuery({ did: resolvedDid });

	useSetTitle(profile ? l`Search @${profile.handle}'s posts` : undefined);

	const fixedParams = useMemo(
		() => ({
			from: profile?.handle ?? name,
		}),
		[profile?.handle, name],
	);

	return (
		<SearchScreenShell
			navButton="back"
			inputPlaceholder={
				profile
					? currentAccount?.did === profile.did
						? l`Search my posts`
						: l`Search @${profile.handle}'s posts`
					: l`Search...`
			}
			fixedParams={fixedParams}
			queryParam={queryParam}
			testID="searchPostsScreen"
		/>
	);
};
