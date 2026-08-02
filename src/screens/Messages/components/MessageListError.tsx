import { type ConvoItem, ConvoItemError } from '#/state/messages/convo/types';

import { Text } from '#/components/Text';
import { InlineButton } from '#/components/web/Link';

import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

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
				<CircleInfo className={css.circleInfoIcon} />

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
