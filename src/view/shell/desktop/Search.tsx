import type { AnyProfileView } from '@atcute/bluesky';
import { StackActions, useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { SearchAutocomplete } from '#/components/SearchAutocomplete/SearchAutocomplete';
import { useNavigateToPath } from '#/components/web/Link';

export function DesktopSearch() {
	const navigation = useNavigation<NavigationProp>();
	const navigateToPath = useNavigateToPath();

	return (
		<SearchAutocomplete
			onNavigate={(path) => navigateToPath(path, 'push')}
			onNavigateToProfile={(profile: AnyProfileView) => navigation.navigate('Profile', { name: profile.did })}
			onSubmit={(query) => navigation.dispatch(StackActions.push('Search', { q: query }))}
		/>
	);
}
