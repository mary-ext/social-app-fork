import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import type { Client } from '@atcute/client';

import { prepareRichtextForPublish } from '#/lib/api/richtext';

/**
 * prepares a starter pack description for publishing.
 *
 * @param appview the appview client, used to resolve mentions
 * @param description the raw description
 * @returns the trimmed description and its facets, or nothing when the description is empty
 */
export async function resolveDescription(
	appview: Client,
	description: string | undefined,
): Promise<{ description?: string; descriptionFacets?: AppBskyRichtextFacet.Main[] }> {
	if (!description) {
		return {};
	}

	const rt = await prepareRichtextForPublish(appview, description);

	return { description: rt.text, descriptionFacets: rt.facets };
}
