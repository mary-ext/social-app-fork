import { View } from 'react-native';
import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord, getRecord, putRecord } from '#/lib/api/records';
import { until } from '#/lib/async/until';
import { isNetworkError } from '#/lib/strings/errors';

import { RQKEY } from '#/state/queries/profile';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { CustomLinkWarningDialog } from '#/components/dialogs/LinkWarning';
import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon } from '#/components/icons/Arrow';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { Link } from '#/components/web/Link';
import { Text as WebText } from '#/components/web/Text';

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
	const { t: l } = useLingui();
	const linkWarningControl = Dialog.useDialogControl();

	return (
		<>
			<Link
				className={css.pill}
				label={l`Open Germ DM`}
				onPress={(evt) => {
					if (isCustomGermDomain(url)) {
						evt.preventDefault();
						linkWarningControl.open();
						return false;
					}
				}}
				to={url}
			>
				<GermLogo size="small" />
				<WebText className={css.label} size="sm" weight="medium">
					<Trans>Germ DM</Trans>
				</WebText>
				<span className={css.arrow}>
					<ArrowTopRightIcon width={14} height={14} fill="currentColor" />
				</span>
			</Link>
			<CustomLinkWarningDialog
				control={linkWarningControl}
				link={{
					displayText: '',
					href: url,
					share: false,
				}}
			/>
		</>
	);
}

function GermLogo({ size }: { size: 'large' | 'small' }) {
	const px = size === 'large' ? 32 : 16;
	return <img alt="" className={css.logo} height={px} src={germLogoUrl} width={px} />;
}

function GermSelfButton({ did }: { did: string }) {
	const t = useTheme();
	const { t: l } = useLingui();
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

					Toast.show(l`Germ DM reconnected`);
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					Toast.show(l`Failed to reconnect Germ DM. Error: ${message}`, {
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
				Toast.show(
					<Toast.Outer>
						<Toast.Icon />
						<Toast.Text>
							<Trans>Germ DM disconnected</Trans>
						</Toast.Text>
						{previousRecord && (
							<Toast.Action label={l`Undo`} onPress={() => void undo()}>
								<Trans>Undo</Trans>
							</Toast.Action>
						)}
					</Toast.Outer>,
				);
			});
		},
		onError: (error) => {
			Toast.show(l`Failed to disconnect Germ DM. Error: ${error?.message}`, {
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
				label={l`Learn more about your Germ DM link`}
				onPress={() => {
					selfExplanationDialogControl.open();
				}}
				style={[t.atoms.bg_contrast_50, a.rounded_full, a.self_start, { padding: 6, paddingRight: 10 }]}
			>
				<GermLogo size="small" />
				<Text style={[a.text_sm, a.font_medium, a.ml_xs]}>
					<Trans>Germ DM</Trans>
				</Text>
			</Button>
			<Dialog.Outer control={selfExplanationDialogControl} nativeOptions={{ preventExpansion: true }}>
				<Dialog.Handle />
				<Dialog.ScrollableInner label={l`Germ DM Link`} style={[{ maxWidth: 400, borderRadius: 36 }]}>
					<View style={[a.flex_row, a.align_center, { gap: 6 }]}>
						<GermLogo size="large" />
						<Text style={[a.text_2xl, a.font_bold]}>
							<Trans>Germ DM Link</Trans>
						</Text>
					</View>

					<Text style={[a.text_md, a.leading_snug, a.mt_sm]}>
						<Trans>
							This button lets others open the Germ DM app to send you a message. You can manage its
							visibility from the Germ DM app, or you can disconnect your Bluesky account from Germ DM
							altogether by clicking the button below.
						</Trans>
					</Text>
					<View style={[a.mt_2xl, a.gap_md]}>
						<Button
							label={l`Got it`}
							size="large"
							color="primary"
							onPress={() => selfExplanationDialogControl.close()}
						>
							<ButtonText>
								<Trans>Got it</Trans>
							</ButtonText>
						</Button>
						<Button
							label={l`Disconnect Germ DM`}
							size="large"
							color="secondary"
							onPress={() => deleteDeclaration()}
							disabled={isPending}
						>
							{isPending && <ButtonIcon icon={Loader} />}
							<ButtonText>
								<Trans>Disconnect Germ DM</Trans>
							</ButtonText>
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
	try {
		const urlp = new URL(url);
		return urlp.hostname !== 'landing.ger.mx';
	} catch {
		return false;
	}
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
