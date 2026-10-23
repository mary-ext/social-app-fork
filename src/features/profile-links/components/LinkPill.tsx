import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { linkWarningDialogHandle } from '#/components/dialogs/handles';
import * as BaseTooltip from '#/components/primitives/tooltip';
import { Button, ButtonAnchor, ButtonIcon } from '#/components/web/Button';
import { isModifiedClick } from '#/components/web/Link';

import ArrowTopRightIcon from '#/icons/central/ArrowUpRight_round_outlined_radius1_stroke2.svg';
import GripIcon from '#/icons/central/DotGrid2x3_round_outlined_radius1_stroke2.svg';
import GlobeIcon from '#/icons/central/Globe_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { getLinkHost, getSupportProvider } from '../providers';
import type { ProfileLink } from '../types';
import { LinkDestination } from './LinkDestination';
import { LinkFavicon, linkFaviconUrl } from './LinkFavicon';
import * as css from './LinkPill.css';
import { linkIcon } from './ProviderLogo';

/**
 * @param link the link
 * @returns the owner's title, "Support on <provider>" for an untitled support link, or the bare domain
 */
export const linkLabel = (link: ProfileLink): string => {
	if (link.title) {
		return link.title;
	}
	const provider = getSupportProvider(link.url);
	return provider ? m['features.profileLinks.supportOn']({ provider: provider.name }) : getLinkHost(link.url);
};

function PillContent({ link, trailing }: { link: ProfileLink; trailing?: ReactNode }) {
	const provider = getSupportProvider(link.url);
	const faviconUrl = provider ? undefined : linkFaviconUrl(link);

	return (
		<>
			{faviconUrl ? (
				<span className={css.faviconSlot}>
					<LinkFavicon fallback={<ButtonIcon icon={GlobeIcon} />} size={16} url={faviconUrl} />
				</span>
			) : (
				<ButtonIcon icon={linkIcon(provider)} />
			)}
			<span className={css.label}>{linkLabel(link)}</span>
			{trailing}
		</>
	);
}

/**
 * link pill with a destination tooltip and external-link warning. modified clicks use browser behavior.
 *
 * @param props the link
 */
export function ProfileLinkAnchor({ link }: { link: ProfileLink }) {
	const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
		if (isModifiedClick(e)) {
			return;
		}
		e.preventDefault();
		linkWarningDialogHandle.openWithPayload({ displayText: '', href: link.url });
	};

	return (
		<BaseTooltip.Root>
			<BaseTooltip.Trigger
				render={
					<ButtonAnchor
						className={css.pill({ end: 'arrow', support: !!getSupportProvider(link.url) })}
						color="secondary"
						href={link.url}
						label={m['features.profileLinks.open']({ name: linkLabel(link) })}
						onClick={onClick}
						rel="noopener noreferrer nofollow"
						size="small"
						target="_blank"
					>
						<PillContent link={link} trailing={<ArrowTopRightIcon className={css.arrow} />} />
					</ButtonAnchor>
				}
			/>
			<BaseTooltip.Positioner side="top" sideOffset={6}>
				<BaseTooltip.Popup className={css.preview}>
					<LinkDestination url={link.url} />
				</BaseTooltip.Popup>
			</BaseTooltip.Positioner>
		</BaseTooltip.Root>
	);
}

/**
 * link pill button for editing.
 *
 * @param props link, accessible label, event handlers, and drag-grip visibility
 */
export function ProfileLinkButton({
	grip,
	label,
	link,
	onClick,
	onKeyDown,
}: {
	grip: boolean;
	label: string;
	link: ProfileLink;
	onClick?: () => void;
	onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}) {
	const support = !!getSupportProvider(link.url);
	return (
		<Button
			className={css.pill({ end: grip ? 'grip' : 'text', support })}
			color="secondary"
			label={label}
			onClick={onClick}
			onKeyDown={onKeyDown}
			size="small"
		>
			<PillContent link={link} trailing={grip ? <GripIcon className={css.grip({ support })} /> : undefined} />
		</Button>
	);
}
