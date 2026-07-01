import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';

import { safeUrlParse } from '#/lib/strings/url-helpers';

import { useSession } from '#/state/session';

import type { LinkWarningPayload } from '#/components/dialogs/Context';
import { CustomLinkWarningDialog } from '#/components/dialogs/LinkWarning';
import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon } from '#/components/icons/Arrow';
import { Text as WebText } from '#/components/Text';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLink } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import germLogoUrl from '../../../../assets/images/germ_logo.webp';
import * as css from './GermButton.css';
import { GermSelfDialog } from './GermSelfDialog';

export function GermButton({
	germ,
	profile,
}: {
	germ: AppBskyActorDefs.ProfileAssociatedGerm;
	profile: AnyProfileView;
}) {
	const { currentAccount } = useSession();

	// exclude `none` and all unknown values
	if (!(germ.showButtonTo === 'everyone' || germ.showButtonTo === 'usersIFollow')) {
		return null;
	}

	if (currentAccount?.did === profile.did) {
		return <GermSelfButton did={currentAccount.did} />;
	}

	if (germ.showButtonTo === 'usersIFollow' && !profile.viewer?.followedBy) {
		return null;
	}

	const url = constructGermUrl(germ, profile, currentAccount?.did);

	if (!url) {
		return null;
	}

	return <GermLink url={url} />;
}

function GermLink({ url }: { url: string }) {
	const linkWarningHandle = Dialog.useDialogHandle<LinkWarningPayload>();

	return (
		<>
			<ExternalLink
				className={css.pill}
				href={url}
				label={m['screens.profile.germDm.action.open']()}
				onPress={() => {
					// a custom domain can't be verified as a real Germ link, so route it through our own warning
					if (isCustomGermDomain(url)) {
						linkWarningHandle.openWithPayload({ displayText: '', href: url, share: false });
						return false;
					}
				}}
			>
				<GermLogo size="small" />
				<WebText className={css.label} size="sm" weight="medium">
					{m['screens.profile.germDm.label']()}
				</WebText>
				<ArrowTopRightIcon className={css.arrow} width={14} height={14} fill={colors.text} />
			</ExternalLink>
			<CustomLinkWarningDialog handle={linkWarningHandle} />
		</>
	);
}

export function GermLogo({ size }: { size: 'large' | 'small' }) {
	const px = size === 'large' ? 32 : 16;
	return <img alt="" className={css.logo} height={px} src={germLogoUrl} width={px} />;
}

function GermSelfButton({ did }: { did: string }) {
	const selfExplanationHandle = Dialog.useDialogHandle();

	return (
		<>
			<Dialog.Trigger
				handle={selfExplanationHandle}
				render={
					<button aria-label={m['screens.profile.germDm.learnMore']()} className={css.pill}>
						<GermLogo size="small" />
						<WebText className={css.label} size="sm" weight="medium">
							{m['screens.profile.germDm.label']()}
						</WebText>
					</button>
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
