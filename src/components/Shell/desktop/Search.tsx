import type { AnyProfileView } from '@atcute/bluesky';

import { SearchAutocomplete } from '#/components/SearchAutocomplete/SearchAutocomplete';
import { useNavigateToPath } from '#/components/web/Link';

import { useNavigate } from '#/routes';

export function DesktopSearch() {
	const navigate = useNavigate();
	const navigateToPath = useNavigateToPath();

	return (
		<SearchAutocomplete
			onNavigate={(path) => navigateToPath(path, 'push')}
			onNavigateToProfile={(profile: AnyProfileView) => navigate('Profile', { actor: profile.did })}
			onSubmit={(query) => navigate('Search', { q: query })}
		/>
	);
}
