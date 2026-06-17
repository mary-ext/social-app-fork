import { useMemo } from 'react';
import { isCanonicalResourceUri, parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useLingui } from '@lingui/react/macro';

import { makeProfileLink } from '#/lib/routes/links';

import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import * as css from './ViewFullThread.css';

export function ViewFullThread({ uri }: { uri: string }) {
	const { t: l } = useLingui();
	const itemHref = useMemo(() => {
		if (!isCanonicalResourceUri(uri)) return undefined;
		const urip = parseCanonicalResourceUri(uri);
		return makeProfileLink({ did: urip.repo }, 'post', urip.rkey);
	}, [uri]);

	if (!itemHref) return null;

	return (
		<Link className={css.link} to={itemHref} label={l`View full thread`}>
			<div className={css.spine}>
				<div className={css.segment} />
				<div className={css.dash} />
				<div className={css.dash} />
				<div className={css.dash} />
				<div className={css.segment} />
			</div>
			<Text color="primary_500" weight="medium">{l`View full thread`}</Text>
		</Link>
	);
}
