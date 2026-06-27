import { View } from 'react-native';
import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord, getRecord, putRecord } from '#/lib/api/records';
import { until } from '#/lib/async/until';
import { isNetworkError } from '#/lib/strings/errors';
import { safeUrlParse } from '#/lib/strings/url-helpers';

import { RQKEY } from '#/state/queries/profile';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import type { LinkWarningPayload } from '#/components/dialogs/Context';
import { CustomLinkWarningDialog } from '#/components/dialogs/LinkWarning';
import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon } from '#/components/icons/Arrow';
import { Loader } from '#/components/Loader';
import { Text as WebText } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useDialogHandle } from '#/components/web/Dialog';
import { ExternalLink } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import germLogoUrl from '../../../../assets/images/germ_logo.webp';
import * as css from './GermButton.css';

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
	const linkWarningHandle = useDialogHandle<LinkWarningPayload>();

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

function GermLogo({ size }: { size: 'large' | 'small' }) {
	const px = size === 'large' ? 32 : 16;
	return <img alt="" className={css.logo} height={px} src={germLogoUrl} width={px} />;
}

function GermSelfButton({ did }: { did: string }) {
	const t = useTheme();
	const selfExplanationDialogControl = Dialog.useDialogControl();
	const { appview, pds } = useClients();
	const queryClient = useQueryClient();

	const { mutate: deleteDeclaration, isPending } = useMutation({
		mutationFn: async () => {
			const previousRecord = await getRecord(pds!, {
				collection: 'com.germnetwork.declaration',
				repo: did as Did,
				rkey: 'self',
			})
				.then((res) => res.value)
				.catch(() => null);

			await deleteRecord(pds!, {
				collection: 'com.germnetwork.declaration',
				repo: did as Did,
				rkey: 'self',
			});

			await whenAppViewReady(appview, did, (res) => !res.associated?.germ);

			return previousRecord;
		},
		onSuccess: (previousRecord) => {
			async function undo() {
				if (!previousRecord) return;
				try {
					await putRecord(pds!, {
						collection: 'com.germnetwork.declaration',
						record: previousRecord,
						repo: did as Did,
						rkey: 'self',
					});
					await whenAppViewReady(appview, did, (res) => !!res.associated?.germ);
					await queryClient.refetchQueries({ queryKey: RQKEY(did) });

					Toast.show(m['screens.profile.germDm.reconnectedToast']());
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					Toast.show(m['screens.profile.germDm.error.reconnect']({ message }), {
						type: 'error',
					});
					if (!isNetworkError(e)) {
						logger.error('Failed to reconnect Germ DM link', {
							safeMessage: e,
						});
					}
				}
			}

			selfExplanationDialogControl.close(() => {
				void queryClient.refetchQueries({ queryKey: RQKEY(did) });
				Toast.show(m['screens.profile.germDm.disconnectedToast'](), {
					action: previousRecord
						? { label: m['screens.profile.action.undo'](), onPress: () => void undo() }
						: undefined,
				});
			});
		},
		onError: (error) => {
			Toast.show(m['screens.profile.germDm.error.disconnect']({ message: error?.message }), {
				type: 'error',
			});
			if (!isNetworkError(error)) {
				logger.error('Failed to disconnect Germ DM link', {
					safeMessage: error,
				});
			}
		},
	});

	return (
		<>
			<Button
				label={m['screens.profile.germDm.learnMore']()}
				onPress={() => {
					selfExplanationDialogControl.open();
				}}
				style={[t.atoms.bg_contrast_50, a.rounded_full, a.self_start, { padding: 6, paddingRight: 10 }]}
			>
				<GermLogo size="small" />
				<Text style={[a.text_sm, a.font_medium, a.ml_xs]}>{m['screens.profile.germDm.label']()}</Text>
			</Button>
			<Dialog.Outer control={selfExplanationDialogControl}>
				<Dialog.Handle />
				<Dialog.ScrollableInner
					label={m['screens.profile.germDm.linkLabel']()}
					style={[{ maxWidth: 400, borderRadius: 36 }]}
				>
					<View style={[a.flex_row, a.align_center, { gap: 6 }]}>
						<GermLogo size="large" />
						<Text style={[a.text_2xl, a.font_bold]}>{m['screens.profile.germDm.linkLabel']()}</Text>
					</View>

					<Text style={[a.text_md, a.leading_snug, a.mt_sm]}>{m['screens.profile.germDm.info']()}</Text>
					<View style={[a.mt_2xl, a.gap_md]}>
						<Button
							label={m['screens.profile.action.gotIt']()}
							size="large"
							color="primary"
							onPress={() => selfExplanationDialogControl.close()}
						>
							<ButtonText>{m['screens.profile.action.gotIt']()}</ButtonText>
						</Button>
						<Button
							label={m['screens.profile.germDm.action.disconnect']()}
							size="large"
							color="secondary"
							onPress={() => deleteDeclaration()}
							disabled={isPending}
						>
							{isPending && <ButtonIcon icon={Loader} />}
							<ButtonText>{m['screens.profile.germDm.action.disconnect']()}</ButtonText>
						</Button>
					</View>
				</Dialog.ScrollableInner>
			</Dialog.Outer>
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

async function whenAppViewReady(
	appview: Client,
	actor: string,
	fn: (res: AppBskyActorDefs.ProfileViewDetailed) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		() => ok(appview.get('app.bsky.actor.getProfile', { params: { actor: actor as ActorIdentifier } })),
	);
}
