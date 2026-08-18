import { isCanonicalResourceUri, parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { postTarget } from '#/lib/routes/targets';

import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import type { RouteTarget } from '#/router';

import * as css from './ViewFullThread.css';

export function ViewFullThread({ uri }: { uri: string }) {
	let itemTarget: RouteTarget | undefined;
	if (isCanonicalResourceUri(uri)) {
		const urip = parseCanonicalResourceUri(uri);
		itemTarget = postTarget(urip.repo, urip.rkey);
	}

	if (!itemTarget) {
		return null;
	}

	return (
		<Link className={css.link} to={itemTarget} label={m['view.posts.thread.viewFull']()}>
			<div className={css.spine}>
				<div className={css.segment} />
				<div className={css.dash} />
				<div className={css.dash} />
				<div className={css.dash} />
				<div className={css.segment} />
			</div>
			<Text color="textLink" weight="medium">
				{m['view.posts.thread.viewFull']()}
			</Text>
		</Link>
	);
}
