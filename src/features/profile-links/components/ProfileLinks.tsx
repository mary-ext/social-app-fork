import { type ReactNode, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useProfileViewLinks } from '#/features/profile-links/link-data';

import * as Dialog from '#/components/Dialog';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { linksFromProfileView } from '../record';
import { wrapLines } from '../row-layout';
import { useItemSizes } from '../use-item-sizes';
import { linkLabel, ProfileLinkAnchor, ProfileLinkButton } from './LinkPill';
import { OwnLinkFormDialog, type OwnLinkFormPayload } from './OwnLinkFormDialog';
import * as css from './ProfileLinks.css';

const MAX_LINES = 2;
/** estimated "+N" width in pixels before measurement. */
const MORE_PILL_GUESS = 48;

type RowItem = { key: string; node: ReactNode };

/**
 * profile links and the optional Germ button. owners can edit links; visitors can open them.
 *
 * @param props the profile, whether it's the viewer's own, whether moderation hides its bio, and the Germ DM
 *   button
 */
export function ProfileHeaderLinks({
	germButton,
	hidden,
	isOwnProfile,
	profile,
}: {
	germButton: ReactNode;
	hidden: boolean;
	isOwnProfile: boolean;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	if (hidden) {
		return <LinkRow germButton={germButton} items={[]} />;
	}
	if (isOwnProfile) {
		return <OwnLinks germButton={germButton} profile={profile} />;
	}
	return <VisitorLinks germButton={germButton} profile={profile} />;
}

function VisitorLinks({
	germButton,
	profile,
}: {
	germButton: ReactNode;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const links = useProfileViewLinks(profile);
	const items: RowItem[] = links.map((link) => {
		return { key: link.url, node: <ProfileLinkAnchor link={link} /> };
	});
	return <LinkRow key={profile.did} germButton={germButton} items={items} />;
}

function OwnLinks({
	germButton,
	profile,
}: {
	germButton: ReactNode;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const formHandle = Dialog.useDialogHandle<OwnLinkFormPayload>();
	const links = linksFromProfileView(profile.links);

	const items: RowItem[] = links.map((link) => {
		return {
			key: link.url,
			node: (
				<ProfileLinkButton
					grip={false}
					label={m['features.profileLinks.editor.edit']({ name: linkLabel(link) })}
					link={link}
					onClick={() => formHandle.openWithPayload({ uri: link.record.uri })}
				/>
			),
		};
	});

	return (
		<>
			<LinkRow key={profile.did} germButton={germButton} items={items} />
			<OwnLinkFormDialog handle={formHandle} links={links} profile={profile} />
		</>
	);
}

function LinkRow({ germButton, items }: { germButton: ReactNode; items: RowItem[] }) {
	if (items.length === 0) {
		// a lone button in the header's column would stretch to full width
		return germButton ? <div className={css.lone}>{germButton}</div> : null;
	}
	return <CappedPillRow items={germButton ? [...items, { key: 'germ', node: germButton }] : items} />;
}

// cap the collapsed row at MAX_LINES, reserving space for the "+N" button.
function CappedPillRow({ items }: { items: RowItem[] }) {
	const { gap, observe, rowWidth: width, sizes } = useItemSizes();
	const [moreWidth, setMoreWidth] = useState(0);
	const [expanded, setExpanded] = useState(false);

	const measured = width > 0 && items.every((item) => sizes[item.key] !== undefined);

	// the keys the folded row shows; null when everything fits
	let shown: Set<string> | null = null;
	if (measured) {
		const keys = items.map((item) => item.key);
		const lines = wrapLines(keys, sizes, { gap, rowWidth: width });
		if (lines.length > MAX_LINES) {
			const kept = lines.slice(0, MAX_LINES);
			const last = kept.at(-1)!;
			const pill = moreWidth || MORE_PILL_GUESS;
			const used = () => last.reduce((sum, key) => sum + sizes[key]!.w + gap, 0);
			while (last.length > 0 && used() + pill > width) {
				last.pop();
			}
			shown = new Set(kept.flat());
		}
	}
	const hiddenCount = shown && !expanded ? items.length - shown.size : 0;

	return (
		<div ref={observe} className={css.row({ measured })}>
			{items.map((item) => {
				const folded = hiddenCount > 0 && !shown!.has(item.key);
				return (
					<div
						key={item.key}
						ref={observe}
						className={css.item({ folded })}
						data-item-key={item.key}
						inert={folded}
					>
						{item.node}
					</div>
				);
			})}
			{hiddenCount > 0 ? (
				<div
					ref={(el) => {
						if (el) {
							setMoreWidth(el.offsetWidth);
						}
					}}
					className={css.item({ folded: false })}
				>
					<Button
						className={css.more}
						color="secondary"
						label={m['features.profileLinks.showMore']({ count: hiddenCount })}
						onClick={() => setExpanded(true)}
						size="small"
					>
						<ButtonText>+{hiddenCount}</ButtonText>
					</Button>
				</div>
			) : null}
		</div>
	);
}
