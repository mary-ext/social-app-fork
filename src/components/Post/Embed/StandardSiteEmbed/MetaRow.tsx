import { Fragment, type ReactNode } from 'react';
import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans } from '@lingui/react/macro';

import { toNiceDomain } from '#/lib/strings/url-helpers';

import { Text } from '#/components/web/Text';

import * as styles from './index.css';
import { matchStandardSitePublisher, matchStandardSitePublisherByUri } from './publishers';
import { isStandardSiteDocumentUri, isStandardSitePublicationUri } from './utils';

/** Row of `domain • by @handle` meta items beneath a standard-site title. */
export function MetaRow({
	type = 'document',
	view,
}: {
	type?: 'document' | 'publication';
	view: AppBskyEmbedExternal.ViewExternal;
}) {
	const highlightedPublisher = !!matchStandardSitePublisher(view);
	const didsFromRecords =
		view.associatedRefs
			?.filter(type === 'document' ? isStandardSiteDocumentUri : isStandardSitePublicationUri)
			.map((ref) => parseCanonicalResourceUri(ref.uri).repo) || [];
	// atm should only be one document
	const authorDid = didsFromRecords.at(0);
	const authorProfile = authorDid ? view.associatedProfiles?.find((p) => p.did === authorDid) : undefined;
	const articleDomain = toNiceDomain(view.uri);
	const articlePublisher = matchStandardSitePublisherByUri(view.uri);
	const domainHandleMatch =
		authorProfile?.handle &&
		(articleDomain === authorProfile.handle || articleDomain.endsWith(`.${authorProfile.handle}`));
	const DomainIcon = articlePublisher?.Icon;

	const items: { key: string; node: ReactNode }[] = [];

	if (!highlightedPublisher && !domainHandleMatch) {
		items.push({
			key: 'domain',
			node: (
				<span className={styles.metaItem}>
					{DomainIcon && <DomainIcon size="xs" fill="currentColor" />}
					<Text size="xs" leading="tight" color="textContrastMedium" numberOfLines={1}>
						{articleDomain}
					</Text>
				</span>
			),
		});
	}

	if (authorProfile) {
		items.push({
			key: 'author',
			node: (
				<Text size="xs" leading="tight" color="textContrastMedium" numberOfLines={1}>
					<Trans>by @{authorProfile.handle}</Trans>
				</Text>
			),
		});
	}

	if (items.length === 0) return null;

	return (
		<div className={styles.metaRow}>
			{items.map((item, i) => (
				<Fragment key={item.key}>
					{i > 0 && (
						<Text size="xs" leading="tight" color="textContrastMedium">
							•
						</Text>
					)}
					{item.node}
				</Fragment>
			))}
		</div>
	);
}
