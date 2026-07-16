import { useTitle } from '#/lib/hooks/useTitle';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

import { SearchScreenShell } from './Shell';

export function SearchScreen() {
	const [{ q }] = useParams('Search');

	useTitle(q || m['common.action.search']());

	return <SearchScreenShell queryParam={q ?? ''} />;
}
