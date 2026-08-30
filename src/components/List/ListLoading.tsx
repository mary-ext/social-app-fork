import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as css from './ListLoading.css';

/** @returns a fallback loading state for lists without row skeletons */
export function ListLoading() {
	return (
		<div className={css.container}>
			<Spinner color="default" label={m['common.status.loading']()} size="_2xl" />
		</div>
	);
}
