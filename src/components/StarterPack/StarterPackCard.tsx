import { useMemo, type ReactNode } from 'react';
import type { AnyStarterPackView, AppBskyGraphStarterpack } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { sanitizeHandle } from '#/lib/strings/handles';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';

import { precacheResolvedUri } from '#/state/queries/resolve-uri';
import { precacheStarterPack } from '#/state/queries/starter-packs';
import { useSession } from '#/state/session';

import { StarterPack as StarterPackIcon } from '#/components/icons/StarterPack';
import { Text } from '#/components/Text';
import { Link as WebLink } from '#/components/web/Link';

import * as css from './StarterPackCard.css';

export function Default({ starterPack }: { starterPack?: AnyStarterPackView }) {
	if (!starterPack) return null;
	return (
		<Link starterPack={starterPack}>
			<Card starterPack={starterPack} />
		</Link>
	);
}

export function Notification({ starterPack }: { starterPack?: AnyStarterPackView }) {
	if (!starterPack) return null;
	return (
		<Link starterPack={starterPack}>
			<Outer>
				<Header>
					<TitleAndByline starterPack={starterPack} />
				</Header>
				<JoinedCount starterPack={starterPack} />
			</Outer>
		</Link>
	);
}

/** The full card body: icon + title/byline header, description, and join count. */
export function Card({ starterPack }: { starterPack: AnyStarterPackView }) {
	return (
		<Outer>
			<Header>
				<Icon />
				<TitleAndByline starterPack={starterPack} />
			</Header>
			<Description starterPack={starterPack} />
			<JoinedCount starterPack={starterPack} />
		</Outer>
	);
}

function Outer({ children }: { children: ReactNode }) {
	return <div className={css.outer}>{children}</div>;
}

function Header({ children }: { children: ReactNode }) {
	return <div className={css.header}>{children}</div>;
}

function Icon() {
	return <StarterPackIcon width={40} gradient="sky" />;
}

function TitleAndByline({ starterPack }: { starterPack: AnyStarterPackView }) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const { creator } = starterPack;
	const record = starterPack.record as AppBskyGraphStarterpack.Main;

	return (
		<div className={css.titleColumn}>
			<Text size="md" weight="semiBold" numberOfLines={2}>
				{record.name}
			</Text>
			<Text size="md_sub" color="textContrastMedium" numberOfLines={1}>
				{creator?.did === currentAccount?.did
					? l`Starter pack by you`
					: l`Starter pack by ${sanitizeHandle(creator.handle, '@')}`}
			</Text>
		</div>
	);
}

function Description({ starterPack }: { starterPack: AnyStarterPackView }) {
	const record = starterPack.record as AppBskyGraphStarterpack.Main;
	if (!record.description) return null;
	return (
		<Text size="md_sub" numberOfLines={3}>
			{record.description}
		</Text>
	);
}

function JoinedCount({ starterPack }: { starterPack: AnyStarterPackView }) {
	const { joinedAllTimeCount } = starterPack;
	if (!joinedAllTimeCount || joinedAllTimeCount < 50) return null;
	return (
		<Text size="md_sub" weight="semiBold" color="textContrastMedium">
			<Trans comment="Number of users (always at least 50) who have joined Bluesky using a specific starter pack">
				<Plural value={joinedAllTimeCount} other="# users have" /> joined!
			</Trans>
		</Text>
	);
}

export function useStarterPackLink({ view }: { view: AnyStarterPackView }) {
	const { t: l } = useLingui();
	const qc = useQueryClient();
	const { rkey, did } = useMemo(() => {
		const rkey = parseCanonicalResourceUri(view.uri).rkey;
		return { rkey, did: view.creator.did };
	}, [view]);
	const precache = () => {
		precacheResolvedUri(qc, view.creator.handle, view.creator.did);
		precacheStarterPack(qc, view);
	};

	return {
		to: `/starter-pack/${did}/${rkey}`,
		label: l`Navigate to ${(view.record as AppBskyGraphStarterpack.Main).name}`,
		precache,
	};
}

export function Link({
	starterPack,
	children,
	className,
	onPress,
}: {
	starterPack: AnyStarterPackView;
	children: ReactNode;
	className?: string;
	onPress?: () => void;
}) {
	const { t: l } = useLingui();
	const queryClient = useQueryClient();
	const record = starterPack.record as AppBskyGraphStarterpack.Main;
	const { rkey, did } = useMemo(() => {
		const rkey = parseCanonicalResourceUri(starterPack.uri).rkey;
		return { rkey, did: starterPack.creator.did };
	}, [starterPack]);

	return (
		<WebLink
			to={`/starter-pack/${did}/${rkey}`}
			label={l`Navigate to ${record.name}`}
			className={clsx(css.link, className)}
			onPress={() => {
				precacheResolvedUri(queryClient, starterPack.creator.handle, starterPack.creator.did);
				precacheStarterPack(queryClient, starterPack);
				onPress?.();
			}}
		>
			{children}
		</WebLink>
	);
}

export function Embed({ starterPack }: { starterPack: AnyStarterPackView }) {
	const imageUri = getStarterPackOgCard(starterPack);

	return (
		<Link starterPack={starterPack} className={css.embedCard}>
			<img className={css.embedImage} src={imageUri} alt="" loading="lazy" />
			<div className={css.embedBody}>
				<Card starterPack={starterPack} />
			</div>
		</Link>
	);
}
