import { useTitle } from '#/state/use-title';

import { useParams } from '#/routes';

import { SearchScreenShell } from './Shell';

export function SearchScreen() {
	const [{ q }] = useParams('Search');

	useTitle(q);

	return <SearchScreenShell queryParam={q} />;
}
