import { useEffect, useState } from 'react';

import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { shareUrl } from '#/lib/sharing';
import { splitApexDomain } from '#/lib/strings/url-helpers';

import * as Dialog from '#/components/Dialog';
import type { LinkWarningPayload } from '#/components/dialogs/Context';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './LinkWarningDialog.css';

export function WarningBody({ close, link }: { close: () => void; link: LinkWarningPayload }) {
	const openLink = useOpenLink();

	const onPressVisit = () => {
		if (link.share) {
			void shareUrl(link.href);
		} else {
			openLink(link.href);
		}
		close();
	};

	return (
		<Stack gap="xl">
			<Stack gap="md">
				<Dialog.Title>{m['components.dialogs.link.title']()}</Dialog.Title>

				<Text color="textContrastHigh">{m['components.dialogs.link.destination']()}</Text>
				<LinkBox href={link.href} />
			</Stack>

			<Dialog.Actions>
				<Button color="secondary" label={m['common.action.goBack']()} onClick={close} variant="ghost">
					<ButtonText>{m['common.action.goBack']()}</ButtonText>
				</Button>
				<Button
					color="primary"
					label={link.share ? m['components.dialogs.link.share']() : m['components.dialogs.link.visit']()}
					onClick={onPressVisit}
					variant="solid"
				>
					<ButtonText>
						{link.share ? m['components.dialogs.link.share']() : m['components.dialogs.link.visit']()}
					</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}

/**
 * url display parts with the hostname left unsplit. used as the fallback until the lazy apex-domain split
 * resolves, and for URLs that fail to parse.
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
