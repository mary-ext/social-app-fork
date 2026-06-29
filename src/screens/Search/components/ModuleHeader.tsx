import { type ComponentType, type ReactNode, useMemo } from 'react';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { makeCustomFeedLink } from '#/lib/routes/links';

import * as FeedCard from '#/components/FeedCard';
import { type Props as SVGIconProps, sizes as iconSizes } from '#/components/icons/common';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon } from '#/components/icons/MagnifyingGlass';
import { Text, type TextProps } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon } from '#/components/web/Button';
import { Link } from '#/components/web/Link';

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
	const { repo: did, rkey } = useMemo(() => parseCanonicalResourceUri(feed.uri), [feed.uri]);
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

export function TitleText({
	children,
	className,
	size = 'xl',
}: {
	children: ReactNode;
	className?: string;
	size?: TextProps['size'];
}) {
	return (
		<Text className={clsx(css.titleText, className)} size={size} weight="semiBold">
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
			<ButtonIcon icon={SearchIcon} size="xl" />
		</Button>
	);
}

export function PinButton({ feed }: { feed: AppBskyFeedDefs.GeneratorView }) {
	return (
		<div className={css.pinButton}>
			<FeedCard.SaveButton
				color="secondary"
				pin
				shape="round"
				size="large"
				text={false}
				variant="ghost"
				view={feed}
			/>
		</div>
	);
}
