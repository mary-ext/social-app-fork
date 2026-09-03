import type { ComponentType, ReactNode, SVGProps } from 'react';

import { clsx } from 'clsx';

import { Text } from '#/components/Text';
import { InlineButton } from '#/components/web/Link';

import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './Notice.css';

/**
 * displays an inline message with optional retry and actions.
 *
 * @param actions additional actions
 * @param children message content
 * @param className class for the outer element
 * @param icon icon beside the message
 * @param onRetry retry handler
 * @param role accessibility role
 * @param title optional title
 * @returns an inline notice
 */
export function Notice({
	actions,
	children,
	className,
	icon: Icon = WarningIcon,
	onRetry,
	role = 'alert',
	title,
}: {
	actions?: ReactNode;
	children: ReactNode;
	className?: string;
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	onRetry?: () => void;
	role?: 'alert' | 'status';
	title?: string;
}) {
	return (
		<div className={clsx(css.outer, className)} role={role}>
			<Icon className={css.icon} />

			<div className={css.body}>
				{title && (
					<Text size="md" weight="semiBold">
						{title}
					</Text>
				)}
				<Text color="textContrastHigh" size="md_sub">
					{children}
				</Text>

				{(onRetry || actions) && (
					<div className={css.actions}>
						{onRetry && (
							<InlineButton
								label={m['common.a11y.pressToRetry']()}
								onClick={onRetry}
								size="md_sub"
								weight="semiBold"
							>
								{m['common.action.tryAgain']()}
							</InlineButton>
						)}
						{actions}
					</div>
				)}
			</div>
		</div>
	);
}
