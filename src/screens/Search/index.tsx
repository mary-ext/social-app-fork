import { useTitle } from '#/lib/hooks/useTitle';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

import { SearchScreenShell } from './Shell';

export function SearchScreen() {
	const { q } = useParams('Search');

	useTitle(m['common.nav.explore']());

	return <SearchScreenShell queryParam={q ?? ''} />;
}
