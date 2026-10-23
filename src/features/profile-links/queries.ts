import type { ComAtprotoRepoApplyWrites, ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyActorDefs, AppBskyActorLink } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Blob as AtpBlob, Did } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation } from '@tanstack/react-query';

import { internalClient } from '#/lib/api/internal-client';
import { uploadBlob } from '#/lib/api/records';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { sameLinkCids, useProfileUpdateMutation } from '#/state/queries/profile';
import { getClients } from '#/state/session';

import { filterModeratedLinkViews, linksFromProfileView, sameLinkContent } from './record';
import type { ProfileLink, SavedProfileLink } from './types';

/**
 * returns visible profile links, or an empty list while moderation settings load.
 *
 * @param profile the profile view
 * @returns the links to show
 */
export const useProfileViewLinks = (profile: AppBskyActorDefs.ProfileViewDetailed): SavedProfileLink[] => {
	const moderationOpts = useModerationOpts();
	if (!moderationOpts) {
		return [];
	}
	return linksFromProfileView(filterModeratedLinkViews(profile.links, moderationOpts));
};

const getPds = () => {
	const { pds } = getClients();
	if (!pds) {
		throw new Error(`not signed in`);
	}
	return pds;
};

const LINK_COLLECTION = 'app.bsky.actor.link';

type LinkRefs = ComAtprotoRepoStrongRef.Main[];

// call deleteRemoved only after the profile no longer references the removed records.
const writeProfileLinks = async (
	did: Did,
	links: ProfileLink[],
	existing: SavedProfileLink[],
): Promise<{ deleteRemoved: () => Promise<void>; refs: LinkRefs }> => {
	const pds = getPds();
	const existingByUri = new Map(existing.map((link) => [link.uri, link]));

	const writes: ComAtprotoRepoApplyWrites.$input['writes'] = [];
	// each link's ref, or the index of the write whose result will be its ref
	const planned = links.map((link): ComAtprotoRepoStrongRef.Main | number => {
		const before = link.uri ? existingByUri.get(link.uri) : undefined;
		if (before && sameLinkContent(before, link)) {
			return { uri: before.uri, cid: before.cid };
		}
		const value = {
			$type: LINK_COLLECTION,
			createdAt: new Date().toISOString(),
			icon: link.icon,
			title: link.title,
			url: link.url,
		} satisfies AppBskyActorLink.Main;
		// preserve the record URI so existing reports still identify this link.
		if (before) {
			writes.push({
				$type: 'com.atproto.repo.applyWrites#update',
				collection: LINK_COLLECTION,
				rkey: parseCanonicalResourceUri(before.uri).rkey,
				value,
			});
		} else {
			writes.push({ $type: 'com.atproto.repo.applyWrites#create', collection: LINK_COLLECTION, value });
		}
		return writes.length - 1;
	});

	let results: ComAtprotoRepoApplyWrites.$output['results'] = [];
	if (writes.length > 0) {
		const data = await ok(pds.post('com.atproto.repo.applyWrites', { input: { repo: did, writes } }));
		results = data.results ?? [];
	}

	const refs = planned.map((plan): ComAtprotoRepoStrongRef.Main => {
		if (typeof plan !== 'number') {
			return plan;
		}
		const result = results[plan];
		if (!result || !('uri' in result)) {
			throw new Error(`missing write result for profile link`);
		}
		return { uri: result.uri, cid: result.cid };
	});

	const kept = new Set<string>(refs.map((ref) => ref.uri));
	const removed = existing.filter((link) => !kept.has(link.uri));

	const deleteRemoved = async () => {
		if (removed.length === 0) {
			return;
		}
		try {
			await ok(
				pds.post('com.atproto.repo.applyWrites', {
					input: {
						repo: did,
						writes: removed.map((link) => {
							return {
								$type: 'com.atproto.repo.applyWrites#delete',
								collection: LINK_COLLECTION,
								rkey: parseCanonicalResourceUri(link.uri).rkey,
							};
						}),
					},
				}),
			);
		} catch (e) {
			// unreferenced records aren't displayed; cleanup failure needn't fail the save.
			console.error('failed to delete profile link records', e);
		}
	};

	return { deleteRemoved, refs };
};

/**
 * saves link records, updates the profile's references, then deletes removed records.
 *
 * @param input owner DID, loaded links, and edited links
 * @param updateProfile must await the supplied refs before writing the profile, then resolve once saved
 * @returns resolves after saving and attempting cleanup; cleanup failures are logged
 */
export const saveWithProfileLinks = async (
	{ did, existing, links }: { did: Did; existing: SavedProfileLink[]; links: ProfileLink[] },
	updateProfile: (refs: Promise<LinkRefs | undefined>) => Promise<void>,
): Promise<void> => {
	const written = writeProfileLinks(did, links, existing);
	await updateProfile(
		written.then(({ refs }) => {
			return refs.length > 0 ? refs : undefined;
		}),
	);
	const { deleteRemoved } = await written;
	await deleteRemoved();
};

/**
 * saves links without changing other profile fields.
 *
 * @returns the mutation
 */
export const useSaveProfileLinksMutation = () => {
	const { mutateAsync: updateProfile } = useProfileUpdateMutation();

	return useMutation({
		mutationFn: ({
			existing,
			links,
			profile,
		}: {
			existing: SavedProfileLink[];
			links: ProfileLink[];
			profile: AppBskyActorDefs.ProfileViewDetailed;
		}) => {
			return saveWithProfileLinks({ did: profile.did, existing, links }, async (pendingRefs) => {
				const refs = await pendingRefs;
				return updateProfile({
					profile,
					updates: (record) => {
						return { ...record, links: refs };
					},
					checkCommitted: (fresh) => {
						return sameLinkCids(fresh.links, refs ?? []);
					},
				});
			});
		},
	});
};

const FAVICON_PROXY = 'https://cardyb.bsky.app/v1/favicon?url=';
const FETCH_TIMEOUT = 8_000;

/**
 * uploads the site's current favicon to the owner's repo.
 *
 * @param url the link's URL
 * @returns the uploaded blob and a local preview, or undefined if fetching or uploading fails
 */
export const uploadLinkIcon = async (url: string): Promise<{ icon: AtpBlob; preview: Blob } | undefined> => {
	let icon: Blob;
	try {
		const res = await fetch(`${FAVICON_PROXY}${encodeURIComponent(url)}&fresh=true`, {
			cache: 'no-store',
			signal: AbortSignal.timeout(FETCH_TIMEOUT),
		});
		if (!res.ok || res.headers.get('content-type') !== 'image/png') {
			return undefined;
		}
		icon = await res.blob();
	} catch {
		return undefined;
	}

	try {
		const blob = await uploadBlob(getPds(), icon, 'image/png');
		return { icon: blob, preview: icon };
	} catch (e) {
		console.error('failed to upload profile link icon', e);
		return undefined;
	}
};

/**
 * fetches page metadata through the link preview service.
 *
 * @param url the link's URL
 * @returns the page's title, or null if it couldn't be reached
 */
export const fetchLinkPage = async (url: string): Promise<{ title: string | undefined } | null> => {
	try {
		const data = await ok(
			internalClient.get('internal.app.extractLinkMeta', {
				params: { url },
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			}),
		);
		// prefer the standard.site title over the HTML title.
		return { title: data.view?.external.title || data.title };
	} catch {
		return null;
	}
};
