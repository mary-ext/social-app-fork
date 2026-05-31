import { useMemo } from 'react';
import {
	type AnyProfileView,
	type AppBskyActorDefs,
	type AppBskyActorStatus,
	type AppBskyEmbedExternal,
} from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import { type $type, type Did, type GenericUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { retry } from '@atproto/common-web';
import { useLingui } from '@lingui/react/macro';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAfter, parseISO } from 'date-fns';

import { deleteRecord, getRecord, putRecord } from '#/lib/api/records';
import { imageToThumb } from '#/lib/api/resolve';
import { uploadBlob } from '#/lib/api/upload-blob';
import { getLinkMeta, type LinkMeta } from '#/lib/link-meta/link-meta';
import { moderateStatus } from '#/lib/moderation/compat';

import { updateProfileShadow, useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useClients, useSession } from '#/state/session';
import { useTickEveryMinute } from '#/state/shell';

import { logger } from '#/logger';

import { useDialogContext } from '#/components/Dialog';
import * as Toast from '#/components/Toast';

import { getLiveServiceNames, isLiveNowUrlAllowed } from '#/features/liveNow/utils';

export * from '#/features/liveNow/utils';

export const DEFAULT_ALLOWED_DOMAINS = ['twitch.tv', 'stream.place', 'bluecast.app'];

const DEFAULT_STATE = {
	status: '',
	isDisabled: false,
	isActive: false,
	record: {},
} satisfies AppBskyActorDefs.StatusView;

const LIVE_NOW_WORKER_CONFIG: {
	allow: string[];
	exceptions: {
		did: string;
		allow: string[];
	}[];
} = {
	allow: [],
	exceptions: [],
};

export type LiveNowConfig = {
	canGoLive: boolean;
	currentAccountAllowedHosts: Set<string>;
	defaultAllowedHosts: Set<string>;
	allowedHostsExceptionsByDid: Map<string, Set<string>>;
};

export function useLiveNowConfig(): LiveNowConfig {
	const { currentAccount } = useSession();

	return useMemo(() => {
		const defaultAllowedHosts = new Set(DEFAULT_ALLOWED_DOMAINS.concat(LIVE_NOW_WORKER_CONFIG.allow));
		const allowedHostsExceptionsByDid = new Map<string, Set<string>>();
		for (const ex of LIVE_NOW_WORKER_CONFIG.exceptions) {
			allowedHostsExceptionsByDid.set(ex.did, new Set(DEFAULT_ALLOWED_DOMAINS.concat(ex.allow)));
		}

		if (!currentAccount?.did) {
			return {
				canGoLive: false,
				currentAccountAllowedHosts: new Set(),
				defaultAllowedHosts,
				allowedHostsExceptionsByDid,
			};
		}

		return {
			canGoLive: true,
			currentAccountAllowedHosts: allowedHostsExceptionsByDid.get(currentAccount.did) ?? defaultAllowedHosts,
			defaultAllowedHosts,
			allowedHostsExceptionsByDid,
		};
	}, [currentAccount]);
}

export function useActorStatus(actor?: AnyProfileView) {
	const shadowed = useMaybeProfileShadow(actor);
	const tick = useTickEveryMinute();
	const config = useLiveNowConfig();
	const moderationOpts = useModerationOpts();

	const moderation = useMemo(() => {
		if (!actor || !('status' in actor && actor.status)) return undefined;
		if (!moderationOpts) return undefined;
		return moderateStatus(actor, moderationOpts);
	}, [actor, moderationOpts]);

	return useMemo(() => {
		void tick; // revalidate every minute

		/*
		 * Do not even allow Live Now to show if filtered for `contentList`.
		 */
		if (moderation && moderation.ui('contentList').filter) {
			return DEFAULT_STATE;
		}

		if (shadowed && 'status' in shadowed && shadowed.status) {
			const isValid = isStatusValidForViewers(shadowed.status, config);
			const isDisabled = shadowed.status.isDisabled;
			const isActive = isStatusStillActive(shadowed.status.expiresAt);
			if (isValid && !isDisabled && isActive) {
				return {
					uri: shadowed.status.uri,
					cid: shadowed.status.cid,
					isDisabled: false,
					isActive: true,
					status: 'app.bsky.actor.status#live',
					embed: shadowed.status.embed as AppBskyActorDefs.StatusView['embed'], // temp_isStatusValid asserts this
					expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
					record: shadowed.status.record,
				} satisfies AppBskyActorDefs.StatusView;
			}
			return {
				uri: shadowed.status.uri,
				cid: shadowed.status.cid,
				isDisabled,
				isActive: false,
				status: 'app.bsky.actor.status#live',
				embed: shadowed.status.embed as AppBskyActorDefs.StatusView['embed'], // temp_isStatusValid asserts this
				expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
				record: shadowed.status.record,
			} satisfies AppBskyActorDefs.StatusView;
		} else {
			return DEFAULT_STATE;
		}
	}, [shadowed, config, tick, moderation]);
}

export function isStatusStillActive(timeStr: string | undefined) {
	if (!timeStr) return false;
	const now = new Date();
	const expiry = parseISO(timeStr);

	return isAfter(expiry, now);
}

/**
 * Validates whether the live status is valid for display in the app. Does NOT validate if the status is valid
 * for the acting user e.g. as they go live.
 */
export function isStatusValidForViewers(status: AppBskyActorDefs.StatusView, config: LiveNowConfig) {
	if (status.status !== 'app.bsky.actor.status#live') return false;
	if (!status.uri) return false; // should not happen, just backwards compat
	try {
		const { repo: liveDid } = parseCanonicalResourceUri(status.uri);
		if (status.embed?.$type === 'app.bsky.embed.external#view') {
			const url = status.embed.external.uri;
			const exception = config.allowedHostsExceptionsByDid.get(liveDid);
			const isValidException = exception ? isLiveNowUrlAllowed(url, exception) : false;
			const isValidForAnyone = isLiveNowUrlAllowed(url, config.defaultAllowedHosts);
			return isValidException || isValidForAnyone;
		} else {
			return false;
		}
	} catch {
		return false;
	}
}

export function useLiveLinkMetaQuery(url: string | null) {
	const liveNowConfig = useLiveNowConfig();
	const { t: l } = useLingui();

	return useQuery({
		enabled: !!url,
		queryKey: ['link-meta', url],
		queryFn: async () => {
			if (!url) return undefined;
			if (!isLiveNowUrlAllowed(url, liveNowConfig.currentAccountAllowedHosts)) {
				const { formatted } = getLiveServiceNames(liveNowConfig.currentAccountAllowedHosts);
				throw new Error(
					l`This service is not supported while the Live feature is in beta. Allowed services: ${formatted}.`,
				);
			}

			return await getLinkMeta(url);
		},
	});
}

export function useUpsertLiveStatusMutation(
	duration: number,
	linkMeta: LinkMeta | null | undefined,
	createdAt?: string,
) {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	const control = useDialogContext();
	const { t: l } = useLingui();

	return useMutation({
		mutationFn: async () => {
			if (!currentAccount) throw new Error('Not logged in');

			let embed: $type.enforce<AppBskyEmbedExternal.Main> | undefined;

			if (linkMeta) {
				let thumb;

				if (linkMeta.image) {
					try {
						const img = await imageToThumb(linkMeta.image);
						if (img) {
							thumb = await uploadBlob(pds!, img.source.blob);
						}
					} catch (e) {
						logger.error(`Failed to upload thumbnail for live status`, {
							url: linkMeta.url,
							image: linkMeta.image,
							safeMessage: e,
						});
					}
				}

				embed = {
					$type: 'app.bsky.embed.external',
					external: {
						$type: 'app.bsky.embed.external#external',
						title: linkMeta.title ?? '',
						description: linkMeta.description ?? '',
						uri: linkMeta.url as GenericUri,
						thumb,
					},
				};
			}

			const record = {
				$type: 'app.bsky.actor.status',
				createdAt: createdAt ?? new Date().toISOString(),
				status: 'app.bsky.actor.status#live',
				durationMinutes: duration,
				embed,
			} satisfies AppBskyActorStatus.Main;

			const upsert = async () => {
				const repo = currentAccount.did as Did;
				const collection = 'app.bsky.actor.status';

				const existing = await getRecord(pds!, { collection, repo, rkey: 'self' }).catch(() => undefined);

				await putRecord(pds!, {
					collection,
					record,
					repo,
					rkey: 'self',
					swapRecord: existing?.cid ?? null,
				});
			};

			await retry(upsert, {
				maxRetries: 5,
				retryable: (e) => e instanceof ClientResponseError && e.error === 'InvalidSwap',
			});

			return {
				record,
				image: linkMeta?.image,
			};
		},
		onError: (e) => {
			logger.error(`Failed to upsert live status`, {
				url: linkMeta?.url,
				image: linkMeta?.image,
				safeMessage: e,
			});
		},
		onSuccess: ({ record, image }) => {
			if (createdAt) {
			} else {
			}

			Toast.show(l`You are now live!`);
			control.close(() => {
				if (!currentAccount) return;

				const expiresAt = new Date(record.createdAt);
				expiresAt.setMinutes(expiresAt.getMinutes() + record.durationMinutes);

				updateProfileShadow(queryClient, currentAccount.did, {
					status: {
						$type: 'app.bsky.actor.defs#statusView',
						status: 'app.bsky.actor.status#live',
						isActive: true,
						expiresAt: expiresAt.toISOString(),
						embed:
							record.embed && image
								? ({
										$type: 'app.bsky.embed.external#view',
										external: {
											...record.embed.external,
											$type: 'app.bsky.embed.external#viewExternal',
											thumb: image,
										},
									} as AppBskyActorDefs.StatusView['embed'])
								: undefined,
						record,
					},
				});
			});
		},
	});
}

export function useRemoveLiveStatusMutation() {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	const control = useDialogContext();
	const { t: l } = useLingui();

	return useMutation({
		mutationFn: async () => {
			if (!currentAccount) throw new Error('Not logged in');

			await deleteRecord(pds!, {
				collection: 'app.bsky.actor.status',
				repo: currentAccount.did as Did,
				rkey: 'self',
			});
		},
		onError: (e) => {
			logger.error(`Failed to remove live status`, {
				safeMessage: e,
			});
		},
		onSuccess: () => {
			Toast.show(l`You are no longer live`);
			control.close(() => {
				if (!currentAccount) return;

				updateProfileShadow(queryClient, currentAccount.did, {
					status: undefined,
				});
			});
		},
	});
}
