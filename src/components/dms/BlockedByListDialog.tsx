import { Fragment } from 'react';
import { View } from 'react-native';
import type { BlockingModerationCause } from '@atcute/bluesky-moderation';

import { listUriToHref } from '#/lib/strings/url-helpers';

import { atoms as a, useTheme } from '#/alf';

import * as Dialog from '#/components/Dialog';
import { type DialogControlProps } from '#/components/Dialog';
import { InlineLinkText } from '#/components/Link';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function BlockedByListDialog({
	control,
	listBlocks,
}: {
	control: DialogControlProps;
	listBlocks: BlockingModerationCause[];
}) {
	const t = useTheme();

	return (
		<Prompt.Outer control={control} testID="blockedByListDialog">
			<Prompt.TitleText>{m['components.dms.block.userBlockedByList']()}</Prompt.TitleText>
			<View style={[a.gap_sm, a.pb_lg]}>
				<Text selectable style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
					{m['components.dms.block.lists.description']()}{' '}
				</Text>

				<Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
					{m['components.dms.block.lists.heading']()}{' '}
					{listBlocks.map((block, i) =>
						block.source ? (
							<Fragment key={block.source.uri}>
								{i === 0 ? null : ', '}
								<InlineLinkText
									label={block.source.name}
									to={listUriToHref(block.source.uri)}
									style={[a.text_md, a.leading_snug]}
								>
									{block.source.name}
								</InlineLinkText>
							</Fragment>
						) : null,
					)}
				</Text>
			</View>
			<Prompt.Actions>
				<Prompt.Action cta={m['components.dms.block.lists.confirm']()} onPress={() => {}} />
			</Prompt.Actions>
			<Dialog.Close />
		</Prompt.Outer>
	);
}
