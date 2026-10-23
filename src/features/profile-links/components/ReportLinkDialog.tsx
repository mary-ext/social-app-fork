import { useState } from 'react';

import { ReportDialog } from '#/features/reporting/ReportDialog';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';

import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import GlobeIcon from '#/icons/central/Globe_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { formatLinkUrl, getSupportProvider } from '../providers';
import type { ProfileLink, SavedProfileLink } from '../types';
import { LinkFavicon, linkFaviconUrl } from './LinkFavicon';
import { linkLabel } from './LinkPill';
import { ProviderLogo } from './ProviderLogo';
import * as css from './ReportLinkDialog.css';

/**
 * selects a profile link to report.
 *
 * @param props the picker's handle, and the links shown on the profile
 */
export function ReportLinkDialog({
	handle,
	links,
}: {
	handle: Dialog.DialogHandle;
	links: SavedProfileLink[];
}) {
	const reportHandle = Dialog.useDialogHandle();
	const [selected, setSelected] = useState<SavedProfileLink | null>(null);
	const reported = selected ?? links[0];

	return (
		<>
			<Dialog.Root handle={handle}>
				<Dialog.Popup scroll="body" size="medium">
					<Dialog.Header.Root border="scrolling">
						<Dialog.Header.Close />
						<Dialog.Header.Title>{m['features.profileLinks.report.title']()}</Dialog.Header.Title>
					</Dialog.Header.Root>
					<Dialog.Body>
						<Text className={css.description} color="textContrastHigh">
							{m['features.profileLinks.report.description']()}
						</Text>
						{links.map((link) => {
							const label = linkLabel(link);
							return (
								<button
									key={link.url}
									aria-label={m['features.profileLinks.report.item']({ name: label })}
									className={css.row}
									onClick={() => {
										setSelected(link);
										handle.close();
										reportHandle.open();
									}}
									type="button"
								>
									<LinkRowIcon link={link} />
									<span className={css.rowText}>
										<Text numberOfLines={1} weight="semiBold">
											{label}
										</Text>
										<Text color="textContrastMedium" numberOfLines={1} size="sm">
											{formatLinkUrl(link.url)}
										</Text>
									</span>
									<ChevronRightIcon className={css.chevron} />
								</button>
							);
						})}
					</Dialog.Body>
				</Dialog.Popup>
			</Dialog.Root>
			{reported ? (
				<ReportDialog
					handle={reportHandle}
					subject={{
						$type: 'app.bsky.actor.defs#profileLinkView',
						cid: reported.cid,
						uri: reported.uri,
						url: reported.url,
					}}
				/>
			) : null}
		</>
	);
}

function LinkRowIcon({ link }: { link: ProfileLink }) {
	const provider = getSupportProvider(link.url);
	if (provider) {
		return (
			<span className={css.supportIcon}>
				<ProviderLogo className={css.supportLogo} provider={provider} />
			</span>
		);
	}

	const globe = <GlobeIcon className={css.globe} />;
	const faviconUrl = linkFaviconUrl(link);
	return (
		<span className={css.iconSlot}>
			{faviconUrl ? <LinkFavicon fallback={globe} size={24} url={faviconUrl} /> : globe}
		</span>
	);
}
