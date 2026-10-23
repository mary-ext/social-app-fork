import { type ReactNode, useEffect, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useConstant } from '#/lib/hooks/use-constant';

import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { useProfileViewLinks } from '../queries';
import { ProfileLinkAnchor } from './LinkPill';
import * as css from './ProfileLinks.css';

const MAX_LINES = 2;
/** estimated "+N" width in pixels before measurement. */
const MORE_PILL_GUESS = 48;

type RowItem = { key: string; node: ReactNode };

/**
 * the row of link pills under the bio, followed by the Germ DM button when the profile shows one.
 *
 * @param props the profile, whether moderation hides its bio, and the Germ DM button
 */
export function ProfileHeaderLinks({
	germButton,
	hidden,
	profile,
}: {
	germButton: ReactNode;
	hidden: boolean;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const viewLinks = useProfileViewLinks(profile);
	const links = hidden ? [] : viewLinks;

	if (links.length === 0) {
		return germButton ? <div className={css.lone}>{germButton}</div> : null;
	}

	const items: RowItem[] = links.map((link) => {
		return { key: link.url, node: <ProfileLinkAnchor did={profile.did} link={link} /> };
	});
	if (germButton) {
		items.push({ key: 'germ', node: germButton });
	}

	// a different profile starts folded again
	return <CappedPillRow key={profile.did} items={items} />;
}

// cap the collapsed row at MAX_LINES, reserving space for the "+N" button.
function CappedPillRow({ items }: { items: RowItem[] }) {
	const [width, setWidth] = useState(0);
	const [gap, setGap] = useState(0);
	const [sizes, setSizes] = useState<Record<string, number>>({});
	const [moreWidth, setMoreWidth] = useState(0);
	const [expanded, setExpanded] = useState(false);

	// offset sizes ignore transforms, like a dialog's zoom-in
	const observer = useConstant(() => {
		return new ResizeObserver((entries) => {
			const updates: Record<string, number> = {};
			for (const { target } of entries) {
				if (!(target instanceof HTMLElement)) {
					continue;
				}
				const key = target.dataset.linkKey;
				if (key === undefined) {
					setWidth(target.clientWidth);
					setGap(parseFloat(getComputedStyle(target).columnGap) || 0);
				} else {
					updates[key] = target.offsetWidth;
				}
			}
			setSizes((prev) => {
				const unchanged = Object.entries(updates).every(([key, w]) => prev[key] === w);
				return unchanged ? prev : { ...prev, ...updates };
			});
		});
	});
	useEffect(() => () => observer.disconnect(), [observer]);

	const observe = (el: HTMLElement | null) => {
		if (el) {
			observer.observe(el);
		}
	};

	const measured = width > 0 && items.every((item) => sizes[item.key] !== undefined);

	// the keys the folded row shows; null when everything fits
	let shown: Set<string> | null = null;
	if (measured) {
		const lines: string[][] = [[]];
		let x = 0;
		for (const item of items) {
			const w = sizes[item.key]!;
			if (x > 0 && x + w > width) {
				lines.push([]);
				x = 0;
			}
			lines.at(-1)!.push(item.key);
			x += w + gap;
		}
		if (lines.length > MAX_LINES) {
			const kept = lines.slice(0, MAX_LINES);
			const last = kept.at(-1)!;
			const pill = moreWidth || MORE_PILL_GUESS;
			const used = () => last.reduce((sum, key) => sum + sizes[key]! + gap, 0);
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
						data-link-key={item.key}
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
