import { useMemo } from 'react';
import { View } from 'react-native';
import { type AnyStarterPackView, type AppBskyGraphStarterpack } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useLingui } from '@lingui/react/macro';
import { Plural, Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { sanitizeHandle } from '#/lib/strings/handles';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';

import { precacheResolvedUri } from '#/state/queries/resolve-uri';
import { precacheStarterPack } from '#/state/queries/starter-packs';
import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import { StarterPack as StarterPackIcon } from '#/components/icons/StarterPack';
import { Link as BaseLink, type LinkProps as BaseLinkProps } from '#/components/Link';
import { Text } from '#/components/Typography';

import { Image } from '#/shims/image';
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
			<Card starterPack={starterPack} noIcon={true} noDescription={true} />
		</Link>
	);
}

export function Card({
	starterPack,
	noIcon,
	noDescription,
}: {
	starterPack: AnyStarterPackView;
	noIcon?: boolean;
	noDescription?: boolean;
}) {
	const { creator, joinedAllTimeCount } = starterPack;
	const record = starterPack.record as AppBskyGraphStarterpack.Main;

	const { t: l } = useLingui();
	const t = useTheme();
	const { currentAccount } = useSession();

	return (
		<View style={[a.w_full, a.gap_md]}>
			<View style={[a.flex_row, a.gap_sm, a.w_full]}>
				{!noIcon ? <StarterPackIcon width={40} gradient="sky" /> : null}
				<View style={[a.flex_1]}>
					<Text emoji style={[a.text_md, a.font_semi_bold, a.leading_snug]} numberOfLines={2}>
						{record.name}
					</Text>
					<Text emoji style={[a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={1}>
						{creator?.did === currentAccount?.did
							? l`Starter pack by you`
							: l`Starter pack by ${sanitizeHandle(creator.handle, '@')}`}
					</Text>
				</View>
			</View>
			{!noDescription && record.description ? (
				<Text emoji numberOfLines={3} style={[a.leading_snug]}>
					{record.description}
				</Text>
			) : null}
			{!!joinedAllTimeCount && joinedAllTimeCount >= 50 && (
				<Text style={[a.font_semi_bold, t.atoms.text_contrast_medium]}>
					<Trans comment="Number of users (always at least 50) who have joined Bluesky using a specific starter pack">
						<Plural value={joinedAllTimeCount} other="# users have" /> joined!
					</Trans>
				</Text>
			)}
		</View>
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
}: {
	starterPack: AnyStarterPackView;
	onPress?: () => void;
	children: BaseLinkProps['children'];
}) {
	const { t: l } = useLingui();
	const queryClient = useQueryClient();
	const record = starterPack.record as AppBskyGraphStarterpack.Main;
	const { rkey, did } = useMemo(() => {
		const rkey = parseCanonicalResourceUri(starterPack.uri).rkey;
		return { rkey, did: starterPack.creator.did };
	}, [starterPack]);

	return (
		<BaseLink
			to={`/starter-pack/${did}/${rkey}`}
			label={l`Navigate to ${record.name}`}
			onPress={() => {
				precacheResolvedUri(queryClient, starterPack.creator.handle, starterPack.creator.did);
				precacheStarterPack(queryClient, starterPack);
			}}
			style={[a.flex_col, a.align_start]}
		>
			{children}
		</BaseLink>
	);
}

export function Embed({ starterPack }: { starterPack: AnyStarterPackView }) {
	const t = useTheme();
	const imageUri = getStarterPackOgCard(starterPack);

	return (
		<View style={[a.border, a.rounded_sm, a.overflow_hidden, t.atoms.border_contrast_low]}>
			<Link starterPack={starterPack}>
				<Image source={imageUri} style={[a.w_full, a.aspect_card]} accessibilityIgnoresInvertColors={true} />
				<View style={[a.px_sm, a.py_md]}>
					<Card starterPack={starterPack} />
				</View>
			</Link>
		</View>
	);
}
