import { isCanonicalResourceUri, parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { makeProfileLink } from '#/lib/routes/links';

import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './ViewFullThread.css';

export function ViewFullThread({ uri }: { uri: string }) {
	let itemHref: string | undefined;
	if (isCanonicalResourceUri(uri)) {
		const urip = parseCanonicalResourceUri(uri);
		itemHref = makeProfileLink({ did: urip.repo }, 'post', urip.rkey);
	}

	if (!itemHref) {
		return null;
	}

	return (
		<Link className={css.link} to={itemHref} label={m['view.posts.thread.viewFull']()}>
			<div className={css.spine}>
				<div className={css.segment} />
				<div className={css.dash} />
				<div className={css.dash} />
				<div className={css.dash} />
				<div className={css.segment} />
			</div>
			<Text color="primary_500" weight="medium">
				{m['view.posts.thread.viewFull']()}
			</Text>
		</Link>
	);
}
