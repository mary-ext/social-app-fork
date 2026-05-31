import { Fragment } from 'react';
import { View } from 'react-native';
import { type BlockingModerationCause } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { listUriToHref } from '#/lib/strings/url-helpers';

import { atoms as a, useTheme } from '#/alf';

import * as Dialog from '#/components/Dialog';
import { type DialogControlProps } from '#/components/Dialog';
import { InlineLinkText } from '#/components/Link';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';

export function BlockedByListDialog({
	control,
	listBlocks,
}: {
	control: DialogControlProps;
	listBlocks: BlockingModerationCause[];
}) {
	const { t: l } = useLingui();
	const t = useTheme();

	return (
		<Prompt.Outer control={control} testID="blockedByListDialog">
			<Prompt.TitleText>{l`User blocked by list`}</Prompt.TitleText>
			<View style={[a.gap_sm, a.pb_lg]}>
				<Text selectable style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
					{l`This account is blocked by one or more of your moderation lists. To unblock, please visit the lists directly and remove this user.`}{' '}
				</Text>

				<Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
					{l`Lists blocking this user:`}{' '}
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
				<Prompt.Action cta={l`I understand`} onPress={() => {}} />
			</Prompt.Actions>
			<Dialog.Close />
		</Prompt.Outer>
	);
}
