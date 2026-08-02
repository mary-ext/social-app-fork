import { JOIN_REQUESTS_THRESHOLD } from '#/state/queries/messages/list-join-requests';

import { Text } from '#/components/Text';

import CloseIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import EnvelopeIcon from '#/icons/central/Email1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

import * as css from './RequestStatus.css';

export function RequestStatus({
	top,
	count,
	onDismiss,
	onPress,
}: {
	top: number;
	count: number;
	onDismiss: () => void;
	onPress: () => void;
}) {
	return (
		<div className={css.root} style={{ top: top + space.xl }}>
			<div className={css.pill}>
				<button
					aria-label={m['screens.messages.requests.viewIncoming.action']()}
					className={css.main}
					onClick={onPress}
					type="button"
				>
					<EnvelopeIcon className={css.statusIcon} />
					<Text className={css.label} color="primary_500" size="sm" weight="semiBold">
						{count > JOIN_REQUESTS_THRESHOLD
							? m['screens.messages.requests.newOverThreshold']({
									count: JOIN_REQUESTS_THRESHOLD,
								})
							: m['screens.messages.requests.newCount']({ count })}
					</Text>
				</button>
				<button
					aria-label={m['screens.messages.a11y.closeBanner']()}
					className={css.close}
					onClick={onDismiss}
					type="button"
				>
					<CloseIcon className={css.statusIcon} />
				</button>
			</div>
		</div>
	);
}
