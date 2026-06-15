import { Trans, useLingui } from '@lingui/react/macro';

import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon } from '#/components/icons/ArrowRotate';
import { Text as TextPrimitive } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

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
	const { t: l } = useLingui();

	return (
		<Button onClick={onPress} size="small" color="secondary_inverted" variant="solid" label={l`Retry`}>
			<ButtonIcon icon={ArrowRotateIcon} />
			<ButtonText>
				<Trans>Retry</Trans>
			</ButtonText>
		</Button>
	);
}
