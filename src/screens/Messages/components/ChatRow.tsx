import type { MouseEvent, ReactNode } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { TimeElapsed } from '#/view/com/util/TimeElapsed';

import { Bell2Off_Filled_Corner0_Rounded as BellStroke } from '#/components/icons/Bell2';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { Link as WebLink } from '#/components/web/Link';

import { colors } from '#/styles/colors';

import * as css from './ChatRow.css';

/**
 * layout primitives for a conversation row. compose them into an explicit variant per conversation kind (see
 * `ChatListItem`, `RequestListItem`) rather than reaching for a single configurable row.
 *
 * the {@link Link} is a transparent overlay over the whole row, so every part of it navigates. interactive
 * siblings — the trailing {@link Menu}, the {@link Footer}'s buttons — stack above the overlay and take their
 * own clicks; everything they don't cover falls through to it.
 */

/** positioned row container. holds the {@link Link} plus any interactive siblings, and paints the row. */
export function Root({ children, tone }: { children: ReactNode; tone: 'default' | 'selected' | 'unread' }) {
	return <div className={clsx(css.root, css.tone[tone])}>{children}</div>;
}

/**
 * transparent overlay covering the whole row, making any part of it navigate. render it as {@link Root}'s
 * first child, before the {@link Body} it sits over.
 */
export function Link({
	action,
	hint,
	label,
	onPointerDown,
	onPress,
	to,
}: {
	/**
	 * in split view the list stays mounted alongside the open conversation, so pushing would stack duplicate
	 * routes on repeated clicks; pass `navigate` there to dedupe by route + params.
	 */
	action: 'navigate' | 'push';
	/** describes what activating the row does, beyond its `label`. */
	hint: string;
	label: string;
	onPointerDown?: () => void;
	/** return `false` to cancel navigation. */
	onPress?: (e: MouseEvent<HTMLElement>) => false | void;
	to: string;
}) {
	return (
		<WebLink
			action={action}
			aria-description={hint}
			className={css.link}
			label={label}
			onPointerDown={onPointerDown}
			onPress={onPress}
			to={to}
		>
			{/* the row's content renders as a sibling, under this overlay */}
			{null}
		</WebLink>
	);
}

export function Body({ children }: { children: ReactNode }) {
	return <div className={css.body}>{children}</div>;
}

/** text column beside the avatar. */
export function Content({ children }: { children: ReactNode }) {
	return <div className={css.content}>{children}</div>;
}

/** first line: a {@link Title} followed by badges, a {@link Timestamp}, {@link MutedIcon}, {@link UnreadDot}. */
export function TitleRow({ children }: { children: ReactNode }) {
	return <div className={css.titleRow}>{children}</div>;
}

/** the conversation's name, truncated to one line. */
export function Title({ children, dim }: { children: string; dim: boolean }) {
	return (
		<Text color={dim ? 'textContrastMedium' : 'text'} numberOfLines={1} weight="semiBold">
			{children}
		</Text>
	);
}

export function Badges({ profile }: { profile: AnyProfileView }) {
	return <ProfileBadges className={css.badges} profile={profile} size="sm" />;
}

/** relative time of the last message, refreshed as it ages. */
export function Timestamp({ sentAt }: { sentAt: string }) {
	return (
		<TimeElapsed timestamp={sentAt}>
			{({ timeElapsed }) => (
				<Text className={css.timestamp} color="textContrastMedium" size="md_sub">
					{timeElapsed}
				</Text>
			)}
		</TimeElapsed>
	);
}

/** bell-with-slash, marking a muted or blocked conversation. */
export function MutedIcon() {
	return <BellStroke className={css.mutedIcon} fill={colors.textContrastMedium} size="xs" />;
}

/** dot marking unread messages; `dim` when the conversation is muted, blocked, or locked. */
export function UnreadDot({ dim }: { dim: boolean }) {
	return <div className={css.unreadDot({ dim })} />;
}

/** pending join-request count for a group. */
export function RequestInfo({ children, dim, unread }: { children: string; dim: boolean; unread: boolean }) {
	return (
		<Text
			className={css.requestInfo}
			color={dim ? 'textContrastMedium' : unread ? 'text' : 'textContrastHigh'}
			numberOfLines={1}
			weight={unread ? 'medium' : undefined}
		>
			{children}
		</Text>
	);
}

/** last line: a preview of the most recent message, with an optional leading icon. */
export function LastMessage({
	children,
	dim,
	icon: Icon,
	unread,
}: {
	children: string;
	dim: boolean;
	icon: React.ComponentType<SVGIconProps> | null;
	unread: boolean;
}) {
	return (
		<div className={css.lastMessageRow}>
			{Icon && (
				<Icon
					className={css.lastMessageIcon}
					fill={unread ? colors.textContrastHigh : colors.textContrastMedium}
					size="xs"
				/>
			)}
			<Text
				color={dim ? 'textContrastMedium' : unread ? 'text' : 'textContrastHigh'}
				numberOfLines={2}
				size="md_sub"
				weight={unread ? 'medium' : undefined}
			>
				{children}
			</Text>
		</div>
	);
}

/** trailing menu, floated over the row's right edge and revealed on hover or focus. */
export function Menu({ children }: { children: ReactNode }) {
	return <div className={css.menu}>{children}</div>;
}

/** action bar under the {@link Link}, aligned with the row's text column. */
export function Footer({ children }: { children: ReactNode }) {
	return <div className={css.footer}>{children}</div>;
}
