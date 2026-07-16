import { RouterView } from '@oomfware/stacker';

import { router } from '#/routes';

export function Shell() {
	return <RouterView router={router} />;
}
