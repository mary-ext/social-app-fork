'use no memo'; // forwarded text props invalidate the generated wrapper cache

import type { ReactNode } from 'react';

import { recordUriToTarget } from '#/lib/routes/targets';

import { type InlineLinkTextProps, InlineLinkText } from '#/components/web/Link';

/**
 * an inline link to the moderation list behind a label or block. a source uri that doesn't name a record
 * renders as plain text: the uri comes from arbitrary label data, and a dead link reads as a broken feature.
 */
export const ModerationListLink = ({
	children,
	list,
	...text
}: Pick<InlineLinkTextProps, 'leading' | 'size'> & {
	children: ReactNode;
	list: { name: string; uri: string };
}) => {
	const target = recordUriToTarget(list.uri);
	if (!target) {
		return children;
	}
	return (
		<InlineLinkText label={list.name} to={target} {...text}>
			{children}
		</InlineLinkText>
	);
};
