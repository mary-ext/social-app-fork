import type { AppBskyActorStatus, AppBskyEmbedExternal } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import type { $type, GenericUri } from '@atcute/lexicons';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteRecord, getRecord, putRecord } from '#/lib/api/records';
import { imageToThumb } from '#/lib/api/resolve';
import { uploadBlob } from '#/lib/api/upload-blob';
import { retry } from '#/lib/async/retry';
import { getLinkMeta, type LinkMeta } from '#/lib/link-meta/link-meta';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import type { DialogHandle } from '#/components/Dialog';
import * as Toast from '#/components/Toast';

import { useLiveNowConfig } from '#/features/liveNow/use-actor-status';
import { getLiveServiceNames, isLiveNowUrlAllowed } from '#/features/liveNow/utils';
import { m } from '#/paraglide/messages';

export * from '#/features/liveNow/utils';

export function useLiveLinkMetaQuery(url: string | null) {
	const liveNowConfig = useLiveNowConfig();
	return useQuery({
		enabled: !!url,
		queryKey: ['link-meta', url],
		queryFn: async () => {
			if (!url) {
				return undefined;
			}
			if (!isLiveNowUrlAllowed(url, liveNowConfig.currentAccountAllowedHosts)) {
				const { formatted } = getLiveServiceNames(liveNowConfig.currentAccountAllowedHosts);
				throw new Error(m['features.liveNow.service.unsupported']({ formatted }));
			}

			return await getLinkMeta(url);
		},
	});
}

export function useUpsertLiveStatusMutation(
	handle: DialogHandle,
	duration: number,
	linkMeta: LinkMeta | null | undefined,
	createdAt?: string,
) {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			if (!currentAccount) {
				throw new Error('Not logged in');
			}

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
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `LinkMeta.url` always carries a scheme
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
				const repo = currentAccount.did;
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

			await retry(5, (e) => e instanceof ClientResponseError && e.error === 'InvalidSwap', upsert);

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
			Toast.show(m['features.liveNow.goLive.started']());
			handle.close();

			if (!currentAccount) {
				return;
			}

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
							? {
									$type: 'app.bsky.embed.external#view',
									external: {
										$type: 'app.bsky.embed.external#viewExternal',
										description: record.embed.external.description,
										// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the resolver hands back an absolute thumbnail url
										thumb: image as GenericUri,
										title: record.embed.external.title,
										uri: record.embed.external.uri,
									},
								}
							: undefined,
					record,
				},
			});
		},
	});
}

export function useRemoveLiveStatusMutation(handle: DialogHandle) {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			if (!currentAccount) {
				throw new Error('Not logged in');
			}

			await deleteRecord(pds!, {
				collection: 'app.bsky.actor.status',
				repo: currentAccount.did,
				rkey: 'self',
			});
		},
		onError: (e) => {
			logger.error(`Failed to remove live status`, {
				safeMessage: e,
			});
		},
		onSuccess: () => {
			Toast.show(m['features.liveNow.goLive.ended']());
			handle.close();

			if (!currentAccount) {
				return;
			}

			updateProfileShadow(queryClient, currentAccount.did, {
				status: undefined,
			});
		},
	});
}
