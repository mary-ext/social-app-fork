import type { AnyProfileView } from '@atcute/bluesky';

import { profileTarget } from '#/lib/routes/targets';

import { SearchAutocomplete } from '#/components/SearchAutocomplete/SearchAutocomplete';
import { useNavigateToPath } from '#/components/web/Link';

import { useRouter } from '#/routes';

export function DesktopSearch() {
	const router = useRouter();
	const navigateToPath = useNavigateToPath();

	return (
		<SearchAutocomplete
			onNavigate={(path) => navigateToPath(path, 'push')}
			onNavigateToProfile={(profile: AnyProfileView) => router.navigate({ to: profileTarget(profile.did) })}
			onSubmit={(query) => router.navigate({ to: { name: 'Search', q: query } })}
		/>
	);
}
