import { useEffect, useState } from 'react';

import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { shareUrl } from '#/lib/sharing';
import { splitApexDomain } from '#/lib/strings/url-helpers';

import { type LinkWarningPayload, useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as css from '#/components/dialogs/LinkWarning.css';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

export function LinkWarningDialog() {
	const { linkWarningDialogControl } = useGlobalDialogsControlContext();
	return <LinkWarningDialogBase handle={linkWarningDialogControl} />;
}

export function CustomLinkWarningDialog({ handle }: { handle: Dialog.DialogHandle<LinkWarningPayload> }) {
	return <LinkWarningDialogBase handle={handle} />;
}

function LinkWarningDialogBase({ handle }: { handle: Dialog.DialogHandle<LinkWarningPayload> }) {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }: { payload: LinkWarningPayload | undefined }) =>
				payload ? <LinkWarningPopup close={() => handle.close()} link={payload} /> : null
			}
		</Dialog.Root>
	);
}

function LinkWarningPopup({ close, link }: { close: () => void; link: LinkWarningPayload }) {
	const openLink = useOpenLink();

	const onPressVisit = () => {
		if (link.share) {
			void shareUrl(link.href);
		} else {
			void openLink(link.href);
		}
		close();
	};

	return (
		<Dialog.Popup label={m['components.dialogs.leaving.title']()} size="narrow">
			<div className={css.outer}>
				<div className={css.content}>
					<Text size="_2xl" weight="bold">
						{m['components.dialogs.leaving.title']()}
					</Text>
					<Text color="textContrastHigh">{m['components.dialogs.link.destinationPrompt']()}</Text>
					<LinkBox href={link.href} />
				</div>
				<div className={css.actions}>
					<Button color="secondary" label={m['common.action.goBack']()} onClick={close} variant="ghost">
						<ButtonText>{m['common.action.goBack']()}</ButtonText>
					</Button>
					<Button
						color="primary"
						label={
							link.share
								? m['components.dialogs.action.shareLink']()
								: m['components.dialogs.action.visitSite']()
						}
						onClick={onPressVisit}
						variant="solid"
					>
						<ButtonText>
							{link.share
								? m['components.dialogs.action.shareLink']()
								: m['components.dialogs.action.visitSite']()}
						</ButtonText>
					</Button>
				</div>
			</div>
		</Dialog.Popup>
	);
}

/**
 * URL display parts with the hostname left unsplit. Used as the fallback shown until the lazy apex-domain
 * split resolves, and for URLs that fail to parse.
 */
function unsplitUrlParts(href: string): [string, string, string] {
	try {
		const urlp = new URL(href);
		return [urlp.protocol + '//', urlp.hostname, urlp.pathname.replace(/\/$/, '') + urlp.search + urlp.hash];
	} catch {
		return ['', href, ''];
	}
}

function LinkBox({ href }: { href: string }) {
	/*
	 * Apex-domain splitting needs the lazily-loaded public-suffix list. Until it resolves — and for URLs
	 * that fail to parse — the hostname is shown unsplit.
	 */
	const [parts, setParts] = useState<[string, string, string]>(() => unsplitUrlParts(href));
	const [scheme, hostname, rest] = parts;

	// re-sync the unsplit parts when href changes, during render, so the new href's base parts are committed
	// in the same frame rather than cascading from an effect.
	const [prevHref, setPrevHref] = useState(href);
	if (prevHref !== href) {
		setPrevHref(href);
		setParts(unsplitUrlParts(href));
	}

	useEffect(() => {
		let urlHostname: string;
		try {
			urlHostname = new URL(href).hostname;
		} catch {
			return;
		}

		let cancelled = false;
		void splitApexDomain(urlHostname).then(([subdomain, apexdomain]) => {
			if (!cancelled) {
				setParts((current) => [current[0] + subdomain, apexdomain, current[2]]);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [href]);

	return (
		<div className={css.linkBox}>
			<Text color="textContrastMedium">
				{scheme}
				<Text weight="semiBold">{hostname}</Text>
				{rest}
			</Text>
		</div>
	);
}
