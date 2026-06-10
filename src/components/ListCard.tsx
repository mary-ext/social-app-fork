import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	type DisplayRestrictions,
	getDisplayRestrictions,
	moderateList,
} from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useLingui, Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { sanitizeHandle } from '#/lib/strings/handles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { precacheList } from '#/state/queries/feed';
import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import { Avatar, Description, Header, Outer, SaveButton } from '#/components/FeedCard';
import { Link as InternalLink, type LinkProps } from '#/components/Link';
import * as Hider from '#/components/moderation/Hider';
import { Text } from '#/components/Typography';

/*
 * This component is based on `FeedCard` and is tightly coupled with that
 * component. Please refer to `FeedCard` for more context.
 */

export {
	Avatar,
	AvatarPlaceholder,
	Description,
	Header,
	Outer,
	SaveButton,
	TitleAndBylinePlaceholder,
} from '#/components/FeedCard';

const CURATELIST = 'app.bsky.graph.defs#curatelist';
const MODLIST = 'app.bsky.graph.defs#modlist';

type Props = {
	view: AppBskyGraphDefs.ListView;
	showPinButton?: boolean;
};

export function Default(props: Props & Omit<LinkProps, 'to' | 'label' | 'children'>) {
	const { view, showPinButton } = props;
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts ? moderateList(view, moderationOpts) : undefined;

	return (
		<Link {...props}>
			<Outer>
				<Header>
					<Avatar src={view.avatar} />
					<TitleAndByline
						title={view.name}
						creator={view.creator}
						purpose={view.purpose}
						modUi={moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentView) : undefined}
					/>
					{showPinButton && view.purpose === CURATELIST && <SaveButton view={view} pin />}
				</Header>
				<Description description={view.description} />
			</Outer>
		</Link>
	);
}

export function Link({ view, children, ...props }: Props & Omit<LinkProps, 'to' | 'label'>) {
	const queryClient = useQueryClient();

	const href = useMemo(() => {
		return createProfileListHref({ list: view });
	}, [view]);

	useEffect(() => {
		precacheList(queryClient, view);
	}, [view, queryClient]);

	return (
		<InternalLink label={view.name} to={href} {...props}>
			{children}
		</InternalLink>
	);
}

export function TitleAndByline({
	title,
	creator,
	purpose = CURATELIST,
	modUi,
}: {
	title: string;
	creator?: AnyProfileView;
	purpose?: AppBskyGraphDefs.ListView['purpose'];
	modUi?: DisplayRestrictions;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	return (
		<View style={[a.flex_1]}>
			<Hider.Outer
				modui={modUi}
				isContentVisibleInitialState={creator && currentAccount?.did === creator.did}
				allowOverride={creator && currentAccount?.did === creator.did}
			>
				<Hider.Mask>
					<Text style={[a.text_md, a.font_semi_bold, a.leading_snug, a.italic]} numberOfLines={1}>
						<Trans>Hidden list</Trans>
					</Text>
				</Hider.Mask>
				<Hider.Content>
					<Text emoji style={[a.text_md, a.font_semi_bold, a.leading_snug]} numberOfLines={1}>
						{title}
					</Text>
				</Hider.Content>
			</Hider.Outer>
			{creator && (
				<Text emoji style={[a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={1}>
					{purpose === MODLIST
						? l`Moderation list by ${sanitizeHandle(creator.handle, '@')}`
						: l`List by ${sanitizeHandle(creator.handle, '@')}`}
				</Text>
			)}
		</View>
	);
}

export function createProfileListHref({ list }: { list: AppBskyGraphDefs.ListView }) {
	const urip = parseCanonicalResourceUri(list.uri);
	return `/profile/${list.creator.did}/lists/${urip.rkey}`;
}
