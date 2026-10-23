import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { safeUrlParse } from '#/lib/utils/url';

import * as Dialog from '#/components/Dialog';
import type { LinkWarningPayload } from '#/components/dialogs/handles';
import { CustomLinkWarningDialog } from '#/components/dialogs/LinkWarningDialog';
import { Button } from '#/components/web/Button';
import { ExternalLinkButton } from '#/components/web/Link';

import ArrowTopRightIcon from '#/icons/central/ArrowUpRight_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import germLogoUrl from '../../../../assets/images/germ_logo.webp';
import * as css from './GermButton.css';
import { GermSelfDialog } from './GermSelfDialog';

/** opens a chat for visitors or the Germ explanation for the owner. */
export type GermTarget = { kind: 'link'; url: string } | { kind: 'self'; did: Did };

/**
 * @param profile the profile
 * @param viewerDid the signed-in account
 * @returns the Germ button action, or null when unavailable to this viewer
 */
export const resolveGermTarget = (profile: AnyProfileView, viewerDid: Did | undefined): GermTarget | null => {
	const germ = profile.associated?.germ;
	// exclude `none` and all unknown values
	if (!germ || !(germ.showButtonTo === 'everyone' || germ.showButtonTo === 'usersIFollow')) {
		return null;
	}
	if (viewerDid === profile.did) {
		return { kind: 'self', did: viewerDid };
	}
	if (germ.showButtonTo === 'usersIFollow' && !profile.viewer?.followedBy) {
		return null;
	}
	const url = constructGermUrl(germ, profile, viewerDid);
	return url ? { kind: 'link', url } : null;
};

/**
 * the Germ DM pill.
 *
 * @param props the action from {@link resolveGermTarget}
 */
export function GermButton({ target }: { target: GermTarget }) {
	switch (target.kind) {
		case 'link': {
			return <GermLink url={target.url} />;
		}
		case 'self': {
			return <GermSelfButton did={target.did} />;
		}
	}
}

function GermLink({ url }: { url: string }) {
	const linkWarningHandle = Dialog.useDialogHandle<LinkWarningPayload>();

	return (
		<>
			<ExternalLinkButton
				className={css.linkPill}
				color="secondary"
				href={url}
				label={m['screens.profile.germDm.action.open']()}
				onPress={() => {
					// a custom domain can't be verified as a real Germ link, so route it through our own warning
					if (isCustomGermDomain(url)) {
						linkWarningHandle.openWithPayload({ displayText: '', href: url, share: false });
						return false;
					}
				}}
				size="small"
			>
				<GermLogo size="small" />
				<span>{m['screens.profile.germDm.label']()}</span>
				<ArrowTopRightIcon className={css.arrow} />
			</ExternalLinkButton>
			<CustomLinkWarningDialog handle={linkWarningHandle} />
		</>
	);
}

export function GermLogo({ size }: { size: 'large' | 'small' }) {
	const px = size === 'large' ? 24 : 16;
	return <img alt="" className={css.logo} height={px} src={germLogoUrl} width={px} />;
}

function GermSelfButton({ did }: { did: Did }) {
	const selfExplanationHandle = Dialog.useDialogHandle();

	return (
		<>
			<Dialog.Trigger
				handle={selfExplanationHandle}
				render={
					<Button
						className={css.selfPill}
						color="secondary"
						label={m['screens.profile.germDm.learnMore']()}
						size="small"
					>
						<GermLogo size="small" />
						<span>{m['screens.profile.germDm.label']()}</span>
					</Button>
				}
			/>
			<GermSelfDialog did={did} handle={selfExplanationHandle} />
		</>
	);
}

function constructGermUrl(
	declaration: AppBskyActorDefs.ProfileAssociatedGerm,
	profile: AnyProfileView,
	viewerDid?: string,
) {
	try {
		const urlp = new URL(declaration.messageMeUrl);

		if (urlp.pathname.endsWith('/')) {
			urlp.pathname = urlp.pathname.slice(0, -1);
		}

		urlp.pathname += '/web';

		if (viewerDid) {
			urlp.hash = `#${profile.did}+${viewerDid}`;
		} else {
			urlp.hash = `#${profile.did}`;
		}

		return urlp.toString();
	} catch {
		return null;
	}
}

function isCustomGermDomain(url: string) {
	const urlp = safeUrlParse(url);
	return urlp === null || urlp.hostname !== 'landing.ger.mx';
}
