import { Fragment } from 'react';

import type { BlockingModerationCause } from '@atcute/bluesky-moderation';

import { listUriToHref } from '#/lib/strings/url-helpers';

import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

export function BlockedByListDialog({
	handle,
	listBlocks,
}: {
	handle: Prompt.PromptHandle;
	listBlocks: BlockingModerationCause[];
}) {
	return (
		<Prompt.Outer handle={handle}>
			<Prompt.Content>
				<Prompt.TitleText>{m['components.dms.block.userBlockedByList']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{m['components.dms.block.lists.description']()}</Prompt.DescriptionText>
				<Text color="textContrastHigh" leading="snug" size="md">
					{m['components.dms.block.lists.heading']()}{' '}
					{listBlocks.map((block, i) =>
						block.source ? (
							<Fragment key={block.source.uri}>
								{i === 0 ? null : ', '}
								<InlineLinkText
									label={block.source.name}
									leading="snug"
									size="md"
									to={listUriToHref(block.source.uri)}
								>
									{block.source.name}
								</InlineLinkText>
							</Fragment>
						) : null,
					)}
				</Text>
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action cta={m['components.dms.block.lists.confirm']()} onPress={() => {}} />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
