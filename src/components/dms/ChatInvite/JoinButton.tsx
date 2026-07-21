import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import * as css from './JoinButton.css';
import type { ChatInviteAction } from './use-chat-invite';

/**
 * action button for a chat invite.
 *
 * @param onPress callback run before the default navigation action
 */
export function JoinButton({
	action,
	onPress,
}: {
	action: ChatInviteAction | undefined;
	onPress?: () => void;
}) {
	if (!action) {
		return null;
	}

	return (
		<Button
			label={action.label}
			color={action.color}
			disabled={action.disabled}
			size="small"
			className={css.joinButton}
			onClick={() => {
				onPress?.();
				action.onPress();
			}}
		>
			{action.side === 'left' && <ButtonIcon icon={action.icon} />}
			<ButtonText>{action.label}</ButtonText>
			{action.side === 'right' && <ButtonIcon icon={action.icon} />}
		</Button>
	);
}
