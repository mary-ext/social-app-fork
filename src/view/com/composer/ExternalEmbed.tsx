import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { clsx } from 'clsx';

import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import { cleanError } from '#/lib/strings/errors';

import { useResolveGifQuery, useResolveLinkQuery } from '#/state/queries/resolve-link';

import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';

import { ExternalEmbed } from '#/components/ExternalEmbed';
import { Loader } from '#/components/Loader';
import { ModeratedFeedEmbed } from '#/components/Post/Embed/FeedEmbed';
import { ModeratedListEmbed } from '#/components/Post/Embed/ListEmbed';
import { StandardSiteEmbed } from '#/components/Post/Embed/StandardSiteEmbed';
import { isStandardSiteEmbed } from '#/components/Post/Embed/StandardSiteEmbed/utils';
import { Embed as StarterPackEmbed } from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';

import type { Gif } from '#/features/gifPicker/types';

import * as styles from './ExternalEmbed.css';

export const ExternalEmbedGif = ({ onRemove, gif }: { onRemove: () => void; gif: Gif }) => {
	const { data, error } = useResolveGifQuery(gif);
	const thumbUrl = useBlobUrl(data?.thumb?.source.blob);
	const linkInfo =
		data &&
		({
			title: data.title ?? data.uri,
			uri: data.uri,
			description: data.description ?? '',
			thumb: thumbUrl,
		} as AppBskyEmbedExternal.ViewExternal);

	const loadingStyle: React.CSSProperties = {
		aspectRatio: (() => {
			const dims = gif.media_formats.gif?.dims;
			if (dims && dims[0] > 0 && dims[1] > 0) {
				return dims[0] / dims[1];
			}
			return 16 / 9; // Default aspect ratio
		})(),
		width: '100%',
	};

	return (
		<div className={styles.container}>
			{linkInfo ? (
				<div className={styles.pointerEventsAuto}>
					<ExternalEmbed link={linkInfo} hideAlt />
				</div>
			) : error ? (
				<Container className={styles.errorContainer}>
					<Text numberOfLines={1} color="textContrastHigh">
						{gif.url}
					</Text>
					<Text numberOfLines={2} className={styles.textNegative}>
						{cleanError(error)}
					</Text>
				</Container>
			) : (
				<Container style={loadingStyle}>
					<Loader size="2xl" />
				</Container>
			)}
			<ExternalEmbedRemoveBtn onRemove={onRemove} />
		</div>
	);
};

export const ExternalEmbedLink = ({
	uri,
	hasQuote,
	onRemove,
}: {
	uri: string;
	hasQuote: boolean;
	onRemove: () => void;
}) => {
	const { data, error } = useResolveLinkQuery(uri);
	const thumbUrl = useBlobUrl(data?.type === 'external' ? data.thumb?.source.blob : undefined);
	let linkComponent: React.ReactNode;
	if (data) {
		if (data.type === 'external') {
			const external = data.view?.external;
			if (external && isStandardSiteEmbed(external)) {
				linkComponent = (
					<StandardSiteEmbed
						preview
						view={
							{
								...external,
								title: external.title || data.title || uri,
								uri,
								description: external.description || data.description,
								// prefer opengraph data to atproto record-derived image
								thumb: thumbUrl || external.thumb,
							} as AppBskyEmbedExternal.ViewExternal
						}
					/>
				);
			} else {
				linkComponent = (
					<ExternalEmbed
						link={
							{
								title: data.title || uri,
								uri,
								description: data.description,
								thumb: thumbUrl,
							} as AppBskyEmbedExternal.ViewExternal
						}
						hideAlt
					/>
				);
			}
		} else if (data.kind === 'feed') {
			linkComponent = (
				<ModeratedFeedEmbed
					embed={{
						type: 'feed',
						view: {
							$type: 'app.bsky.feed.defs#generatorView',
							...data.view,
						},
					}}
				/>
			);
		} else if (data.kind === 'list') {
			linkComponent = (
				<ModeratedListEmbed
					embed={{
						type: 'list',
						view: {
							$type: 'app.bsky.graph.defs#listView',
							...data.view,
						},
					}}
				/>
			);
		} else if (data.kind === 'starter-pack') {
			linkComponent = <StarterPackEmbed starterPack={data.view} />;
		}
	}

	if (data?.type === 'record' && hasQuote) {
		// This is not currently supported by the data model so don't preview it.
		return null;
	}

	return (
		<div className={styles.linkContainer}>
			{linkComponent ? (
				<div className={styles.pointerEventsNone}>{linkComponent}</div>
			) : error ? (
				<Container className={styles.errorContainer}>
					<Text numberOfLines={1} color="textContrastHigh">
						{uri}
					</Text>
					<Text numberOfLines={2} className={styles.textNegative}>
						{cleanError(error)}
					</Text>
				</Container>
			) : (
				<Container>
					<Loader size="2xl" />
				</Container>
			)}
			<ExternalEmbedRemoveBtn onRemove={onRemove} />
		</div>
	);
};

function Container({
	style,
	className,
	children,
}: {
	style?: React.CSSProperties;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={clsx(styles.contentContainer, className)} style={style}>
			{children}
		</div>
	);
}
