import { RouterView } from '#/lib/router';

import { router } from '#/routes';

export function Shell() {
	return <RouterView router={router} />;
}
