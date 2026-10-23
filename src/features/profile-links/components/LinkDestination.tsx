import { safeUrlParse } from '#/lib/utils/url';

import { Text } from '#/components/Text';

import { getLinkHost } from '../providers';

/**
 * displays the destination host, path, and query, with the host emphasized.
 *
 * @param props the link's URL
 */
export function LinkDestination({ url }: { url: string }) {
	const parsed = safeUrlParse(url);
	const host = getLinkHost(url);
	const rest = parsed ? parsed.pathname.replace(/\/$/, '') + parsed.search : '';

	return (
		<Text color="textContrastMedium" leading="snug" numberOfLines={2} size="md_sub">
			<Text color="text" leading="snug" size="md_sub" weight="semiBold">
				{host}
			</Text>
			{rest}
		</Text>
	);
}
