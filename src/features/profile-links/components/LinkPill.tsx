import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { resolveUrl } from '#/lib/routes/app-links';

import { linkWarningDialogHandle } from '#/components/dialogs/handles';
import * as BaseTooltip from '#/components/primitives/tooltip';
import { Button, ButtonIcon } from '#/components/web/Button';
import { ExternalLinkButton, isModifiedClick } from '#/components/web/Link';

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

function PillContent({ link, trailing }: { link: ProfileLink; trailing: ReactNode }) {
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
 * link pill with a destination tooltip. links that resolve in-app navigate directly; the rest go through the
 * external-link warning. modified clicks use browser behavior.
 *
 * @param props the link
 */
export function ProfileLinkAnchor({ link }: { link: ProfileLink }) {
	const onPress = (e: MouseEvent<HTMLElement>) => {
		if (isModifiedClick(e) || resolveUrl(link.url)) {
			return;
		}
		linkWarningDialogHandle.openWithPayload({ displayText: '', href: link.url });
		return false;
	};

	return (
		<BaseTooltip.Root>
			<BaseTooltip.Trigger
				render={
					<ExternalLinkButton
						className={css.pill({ end: 'arrow', support: !!getSupportProvider(link.url) })}
						color="secondary"
						href={link.url}
						label={m['features.profileLinks.open']({ name: linkLabel(link) })}
						onPress={onPress}
						size="small"
					>
						<PillContent link={link} trailing={<ArrowTopRightIcon className={css.arrow} />} />
					</ExternalLinkButton>
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
 * draggable link pill button for editing.
 *
 * @param props link, accessible label, and event handlers
 */
export function ProfileLinkButton({
	label,
	link,
	onClick,
	onKeyDown,
}: {
	label: string;
	link: ProfileLink;
	onClick: () => void;
	onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}) {
	const support = !!getSupportProvider(link.url);
	return (
		<Button
			className={css.pill({ end: 'grip', support })}
			color="secondary"
			label={label}
			onClick={onClick}
			onKeyDown={onKeyDown}
			size="small"
		>
			<PillContent link={link} trailing={<GripIcon className={css.grip({ support })} />} />
		</Button>
	);
}
