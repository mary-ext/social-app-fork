import type { ComponentType, ReactNode, SVGProps } from 'react';

import { clsx } from 'clsx';

import { Text } from '#/components/Text';
import { InlineButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './Notice.css';

/**
 * displays an inline message with optional retry and actions.
 *
 * @param actions additional actions
 * @param children message content
 * @param className class for the outer element
 * @param icon custom icon
 * @param onRetry retry handler
 * @param title optional title
 * @returns an inline notice
 */
export function Notice({
	actions,
	children,
	className,
	icon: Icon,
	onRetry,
	title,
}: {
	actions?: ReactNode;
	children: ReactNode;
	className?: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	onRetry?: () => void;
	title?: string;
}) {
	return (
		<div className={clsx(css.outer, className)}>
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
