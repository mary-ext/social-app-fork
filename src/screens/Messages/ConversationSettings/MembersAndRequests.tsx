import type { ConvoWithDetails } from '#/components/dms/util';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import * as css from './MembersAndRequests.css';

export function MembersAndRequests({
	convo,
	requestCount,
	hasMoreRequests,
	isOwner,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	requestCount: number;
	hasMoreRequests: boolean;
	isOwner: boolean;
}) {
	const router = useRouter();

	const memberCount = convo.details.memberCount;
	const memberLimit = convo.details.memberLimit;

	return (
		<div className={css.row}>
			<div className={css.labelGroup}>
				<Text size="lg" weight="semiBold">
					{m['screens.messages.members.label']()}
				</Text>
				<Text size="xs" weight="medium" color="textContrastMedium">
					{m['screens.messages.members.countRatio']({
						count: memberCount,
						limit: memberLimit,
					})}
				</Text>
			</div>
			{isOwner && requestCount > 0 ? (
				<InlineLinkText
					align="right"
					label={m['screens.messages.requests.viewIncoming.a11yGroup']()}
					size="sm"
					to={router.build('MessagesJoinRequests', { conversation: convo.view.id })}
					weight="semiBold"
				>
					{hasMoreRequests
						? m['screens.messages.requests.countOverflow']({ count: requestCount })
						: m['screens.messages.requests.count']({ count: requestCount })}
				</InlineLinkText>
			) : null}
		</div>
	);
}
