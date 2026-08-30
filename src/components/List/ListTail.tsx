import type { ReactNode } from 'react';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './ListTail.css';

/**
 * reserves space for pagination state.
 *
 * @param border whether to show the divider
 * @param children pagination state
 * @returns the list tail
 */
export function Frame({ border = true, children }: { border?: boolean; children?: ReactNode }) {
	return <div className={css.frame({ border })}>{children}</div>;
}

/** @returns a pagination spinner */
export function Pending() {
	return <Spinner color="default" label={m['common.status.loading']()} size="_2xl" />;
}

/**
 * renders a pagination error.
 *
 * @param message error message
 * @param onRetry retry handler
 * @returns the error row
 */
export function Error({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<div className={css.errorOuter}>
			<div className={css.errorRow}>
				<Text className={css.errorText} color="textContrastMedium" numberOfLines={2} size="sm">
					{message}
				</Text>
				<Button label={m['common.a11y.pressToRetry']()} onClick={onRetry} variant="solid">
					<ButtonText>{m['common.action.retry']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}

/**
 * renders an end of list message.
 *
 * @param children end-of-list message
 * @returns the end marker
 */
export function End({ children }: { children: ReactNode }) {
	return (
		<Text color="textContrastLow" size="sm">
			{children}
		</Text>
	);
}
