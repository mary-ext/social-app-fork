import { JOIN_REQUESTS_THRESHOLD } from '#/state/queries/messages/list-join-requests';

import { Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon } from '#/components/icons/Envelope';
import { TimesLarge_Stroke2_Corner0_Rounded as CloseIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';
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
					<EnvelopeIcon fill={colors.primary_500} size="lg" />
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
					<CloseIcon fill={colors.primary_500} size="lg" />
				</button>
			</div>
		</div>
	);
}
