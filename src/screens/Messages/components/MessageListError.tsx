import { type ConvoItem, ConvoItemError } from '#/state/messages/convo/types';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Text';
import { InlineButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './MessageListError.css';

export function MessageListError({ item }: { item: ConvoItem & { type: 'error' } }) {
	const { description, help, cta } = {
		[ConvoItemError.FirehoseFailed]: {
			description: m['screens.messages.connection.disconnected'](),
			help: m['screens.messages.connection.reconnect.a11y'](),
			cta: m['screens.messages.connection.reconnect.action'](),
		},
		[ConvoItemError.HistoryFailed]: {
			description: m['screens.messages.conversation.loadPastError'](),
			help: m['common.a11y.pressToRetry'](),
			cta: m['common.action.retry'](),
		},
	}[item.code];

	return (
		<div className={css.outer}>
			<div className={css.inner}>
				<CircleInfo fill={colors.negative_400} size="sm" />

				<Text color="textContrastMedium">
					{description}
					{item.retry && (
						<>
							{' '}
							&middot;{' '}
							<InlineButton label={help} onClick={() => item.retry?.()}>
								{cta}
							</InlineButton>
						</>
					)}
				</Text>
			</div>
		</div>
	);
}
