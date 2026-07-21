import type { ComponentType, ReactNode } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { makeCustomFeedLink } from '#/lib/routes/links';

import { useToggleSavedFeed } from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { type Props as SVGIconProps, sizes as iconSizes } from '#/components/icons/common';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon } from '#/components/icons/MagnifyingGlass';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import { Text, type TextProps } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon } from '#/components/web/Button';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './ModuleHeader.css';

export function Container({
	bottomBorder,
	children,
	className,
}: {
	bottomBorder?: boolean;
	children: ReactNode;
	className?: string;
}) {
	return <div className={clsx(css.container({ bottomBorder }), className)}>{children}</div>;
}

export function FeedLink({ children, feed }: { children?: ReactNode; feed: AppBskyFeedDefs.GeneratorView }) {
	const { repo: did, rkey } = parseCanonicalResourceUri(feed.uri);
	return (
		<Link className={css.feedLink} label={feed.displayName} to={makeCustomFeedLink(did, rkey)}>
			{children}
		</Link>
	);
}

export function FeedAvatar({ feed }: { feed: AppBskyFeedDefs.GeneratorView }) {
	return <UserAvatar avatar={feed.avatar} size={40} type="algo" />;
}

export function Icon({
	icon: Comp,
	size = 'lg',
}: {
	icon: ComponentType<SVGIconProps>;
	size?: SVGIconProps['size'];
}) {
	const iconSize = iconSizes[size ?? 'lg'];
	return (
		<div className={css.icon} style={assignInlineVars({ [css.iconSizeVar]: `${iconSize}px` })}>
			<Comp width={iconSize} />
		</div>
	);
}

export function TitleText({ children, size = 'xl' }: { children: ReactNode; size?: TextProps['size'] }) {
	return (
		<Text className={css.titleText} size={size} weight="semiBold">
			{children}
		</Text>
	);
}

export function SubtitleText({ children }: { children: ReactNode }) {
	return (
		<Text className={css.subtitleText} color="textContrastMedium" size="md_sub">
			{children}
		</Text>
	);
}

export function SearchButton({ label, onClick }: { label: string; onClick?: () => void }) {
	return (
		<Button
			className={css.searchButton}
			color="secondary"
			label={label}
			onClick={onClick}
			shape="round"
			size="small"
			variant="ghost"
		>
			<ButtonIcon icon={SearchIcon} size="lg" />
		</Button>
	);
}

export function PinButton({ feed }: { feed: AppBskyFeedDefs.GeneratorView }) {
	const { hasSession } = useSession();
	if (!hasSession) {
		return null;
	}
	return <PinButtonInner feed={feed} />;
}

function PinButtonInner({ feed }: { feed: AppBskyFeedDefs.GeneratorView }) {
	const removePromptHandle = Prompt.usePromptHandle();
	const { isPending, isSaved, toggleSave } = useToggleSavedFeed({ pin: true, type: 'feed', uri: feed.uri });

	return (
		<div className={css.pinButton}>
			<Button
				color="secondary"
				disabled={isPending}
				label={m['common.feeds.action.add']()}
				onClick={isSaved ? () => removePromptHandle.open(null) : () => void toggleSave()}
				shape="round"
				size="small"
				variant="ghost"
			>
				{isPending ? (
					<Spinner color="default" label={null} size="sm" />
				) : (
					<ButtonIcon icon={isSaved ? TrashIcon : PinIcon} size="lg" />
				)}
			</Button>

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={m['common.action.remove']()}
				description={m['common.feeds.remove.message']()}
				handle={removePromptHandle}
				onConfirm={() => void toggleSave()}
				title={m['common.feeds.remove.title']()}
			/>
		</div>
	);
}
