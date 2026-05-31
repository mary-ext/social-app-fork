import { type ComAtprotoRepoStrongRef } from '@atcute/atproto';
import { type AppBskyEmbedExternal } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

export function isStandardSiteDocumentUri(ref: ComAtprotoRepoStrongRef.Main) {
	return parseCanonicalResourceUri(ref.uri).collection.startsWith('site.standard.document');
}

export function isStandardSitePublicationUri(ref: ComAtprotoRepoStrongRef.Main) {
	return parseCanonicalResourceUri(ref.uri).collection.startsWith('site.standard.publication');
}

export function isStandardSiteUri(ref: ComAtprotoRepoStrongRef.Main) {
	return parseCanonicalResourceUri(ref.uri).collection.startsWith('site.standard.');
}

export function isStandardSiteEmbed(view: AppBskyEmbedExternal.ViewExternal) {
	return view.associatedRefs?.some((ref) => isStandardSiteUri(ref));
}

export function isStandardSitePublicationEmbed(view: AppBskyEmbedExternal.ViewExternal) {
	return (
		view.associatedRefs?.some(
			(ref) => parseCanonicalResourceUri(ref.uri).collection === 'site.standard.publication',
		) &&
		view.associatedRefs.every(
			(ref) => parseCanonicalResourceUri(ref.uri).collection !== 'site.standard.document',
		)
	);
}
