import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon } from '#/components/icons/ArrowRotate';
import { Text as TextPrimitive } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './VideoFallback.css';

export function Container({ children }: { children: React.ReactNode }) {
	return <div className={styles.container}>{children}</div>;
}

export function Text({ children }: { children: React.ReactNode }) {
	return (
		<TextPrimitive size="md" align="center" className={styles.text}>
			{children}
		</TextPrimitive>
	);
}

export function RetryButton({ onPress }: { onPress: () => void }) {
	return (
		<Button
			onClick={onPress}
			size="small"
			color="secondary_inverted"
			variant="solid"
			label={m['common.action.retry']()}
		>
			<ButtonIcon icon={ArrowRotateIcon} />
			<ButtonText>{m['common.action.retry']()}</ButtonText>
		</Button>
	);
}
