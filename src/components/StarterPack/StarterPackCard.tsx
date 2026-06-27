import { useMemo, type ReactNode } from 'react';
import type { AnyStarterPackView, AppBskyGraphStarterpack } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { weightedRandomIndex } from '#/lib/numbers';
import { sanitizeHandle } from '#/lib/strings/handles';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';

import { precacheResolvedUri } from '#/state/queries/resolve-uri';
import { precacheStarterPack } from '#/state/queries/starter-packs';
import { useSession } from '#/state/session';

import { EmbedThumb } from '#/components/EmbedThumb';
import { StarterPack as StarterPackIcon } from '#/components/icons/StarterPack';
import { Text } from '#/components/Text';
import { Link as WebLink } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { borderRadius } from '#/styles/tokens.css';

import * as css from './StarterPackCard.css';

type DefaultProps = {
	className?: string;
	starterPack?: AnyStarterPackView;
	topBorder?: boolean;
};

/** A list-row starter pack card */
export function Default({ className, starterPack, topBorder }: DefaultProps) {
	if (!starterPack) return null;
	return (
		<Link className={clsx(css.defaultRow({ topBorder }), className)} starterPack={starterPack}>
			<Card starterPack={starterPack} />
		</Link>
	);
}

/** A compact starter pack card for notifications. */
export function Notification({ starterPack }: { starterPack?: AnyStarterPackView }) {
	if (!starterPack) return null;
	return (
		<Outer>
			<Header>
				<TitleAndByline starterPack={starterPack} />
			</Header>
			<JoinedCount starterPack={starterPack} />
		</Outer>
	);
}

/** The full card body */
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
					? m['common.label.starterPackByYou']()
					: m['components.starterPack.byline']({ handle: sanitizeHandle(creator.handle, '@') })}
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
			{m['components.starterPack.joinedCount']({ joinedAllTimeCount })}
		</Text>
	);
}

/**
 * Builds a navigable link to the starter pack screen plus a precache helper for the creator and starter pack
 * queries.
 */
export function useStarterPackLink({ view }: { view: AnyStarterPackView }) {
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
		label: m['components.starterPack.a11y.navigate']({
			name: (view.record as AppBskyGraphStarterpack.Main).name,
		}),
		precache,
	};
}

/** A clickable wrapper that navigates to the starter pack screen and precaches its data. */
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
	const queryClient = useQueryClient();
	const record = starterPack.record as AppBskyGraphStarterpack.Main;
	const { rkey, did } = useMemo(() => {
		const rkey = parseCanonicalResourceUri(starterPack.uri).rkey;
		return { rkey, did: starterPack.creator.did };
	}, [starterPack]);

	return (
		<WebLink
			to={`/starter-pack/${did}/${rkey}`}
			label={m['components.starterPack.a11y.navigate']({ name: record.name })}
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

/** A starter pack embedded in a post: OG card image on top and the card body below. */
export function Embed({ starterPack }: { starterPack: AnyStarterPackView }) {
	const imageUri = getStarterPackOgCard(starterPack);

	return (
		<Link starterPack={starterPack} className={css.embedCard}>
			<EmbedThumb src={imageUri} />
			<div className={css.embedBody}>
				<Card starterPack={starterPack} />
			</div>
		</Link>
	);
}

/** Placeholder for the header's 40×40 starter-pack icon block. */
function IconPlaceholder() {
	return <Skeleton.Square radius={borderRadius.sm} size={40} />;
}

/** Placeholder for the title + byline stack that sits beside the icon. */
function TitleAndBylinePlaceholder() {
	return (
		<Skeleton.Col>
			<Skeleton.Text size="md" width="60%" />
			<Skeleton.Text blend size="md_sub" width="40%" />
		</Skeleton.Col>
	);
}

// weighted description-line counts: most starter pack descriptions are short (1 line) or empty, with a long
// tail toward 2–3. index = line count (0–3).
const DESCRIPTION_LINE_WEIGHTS = [12, 10, 4, 1];

function LoadingRow({
	descriptionLines,
	joinedCount,
	topBorder,
}: {
	descriptionLines: number;
	joinedCount: boolean;
	topBorder: boolean;
}) {
	return (
		<Skeleton.Col className={css.loadingRow({ topBorder })} gap="sm">
			<Skeleton.Row align="start" gap="sm">
				<IconPlaceholder />
				<TitleAndBylinePlaceholder />
			</Skeleton.Row>
			{descriptionLines > 0 && <Skeleton.Lines count={descriptionLines} lastWidth={70} size="md_sub" />}
			{joinedCount && <Skeleton.Text size="md_sub" width="35%" />}
		</Skeleton.Col>
	);
}

// fallback row count when the caller doesn't know how many starter packs to expect, and a cap so a profile
// with many packs doesn't render dozens of placeholder rows.
const DEFAULT_LOADING_ROW_COUNT = 3;
const MAX_LOADING_ROW_COUNT = 10;

// ~10% of packs have 50+ all-time joins and show a "joined" line; the rest omit it.
const JOINED_COUNT_WEIGHT = [9, 1];

/**
 * A stack of starter-pack-card placeholders for the loading state, mirroring {@link Default}'s layout (icon,
 * title/byline, description, joined count) so it sits on the same rhythm as the real cards.
 *
 * @param count number of placeholder rows; callers should pass the known starter-pack count when available
 *   (e.g. `profile.associated.starterPacks`). Defaults to a small value and is capped so large counts don't
 *   render excessive rows.
 */
export function LoadingPlaceholder({ count }: { count?: number }): React.ReactNode {
	const rowCount = Math.min(count ?? DEFAULT_LOADING_ROW_COUNT, MAX_LOADING_ROW_COUNT);
	const rows = Array.from({ length: rowCount }, () => ({
		// starter pack descriptions are often empty or short; weight toward 0–1 lines with a tail toward 2–3.
		descriptionLines: weightedRandomIndex(DESCRIPTION_LINE_WEIGHTS),
		joinedCount: weightedRandomIndex(JOINED_COUNT_WEIGHT) === 1,
	}));

	return (
		<>
			{rows.map((row, i) => (
				<LoadingRow
					key={i}
					descriptionLines={row.descriptionLines}
					joinedCount={row.joinedCount}
					topBorder={i !== 0}
				/>
			))}
		</>
	);
}
