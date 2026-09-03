'use no memo'; // generated cache cost outweighs reuse in this shallow renderer

import type { ComponentType, ReactNode, SVGProps } from 'react';

import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import ArrowRotateCounterClockwiseIcon from '#/icons/central/ArrowRotateCounterClockwise_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ContentState.css';
import { Stack } from './Stack';

export type ContentStateIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type ContentStateProps = {
	actions?: ReactNode;
	headerTitle?: string;
	icon?: ContentStateIcon;
	message: ReactNode;
	onRetry?: () => void;
	standalone?: boolean;
	title?: string;
};

/**
 * displays a centered state for a content region.
 *
 * announces the state with the provided accessibility role.
 *
 * @param actions additional actions
 * @param headerTitle standalone header title
 * @param icon optional icon
 * @param message body content
 * @param onRetry retry handler
 * @param role accessibility role
 * @param standalone whether to render a header
 * @param title optional title
 * @returns a content state
 */
export function ContentState({
	actions,
	headerTitle,
	icon: Icon,
	message,
	onRetry,
	role = 'status',
	standalone = false,
	title,
}: ContentStateProps & { role?: 'alert' | 'status' }) {
	const retry = onRetry && (
		<Button
			color="primary"
			label={m['common.a11y.pressToRetry']()}
			onClick={onRetry}
			size="small"
			variant="solid"
		>
			<ButtonIcon icon={ArrowRotateCounterClockwiseIcon} />
			<ButtonText>{m['common.action.tryAgain']()}</ButtonText>
		</Button>
	);

	const block = (
		<div className={css.outer} role={role}>
			{Icon && <Icon className={css.icon} />}

			<Stack gap="xs">
				{title && (
					<Text size="lg" weight="semiBold">
						{title}
					</Text>
				)}
				<Text align="center" className={css.message} color="textContrastHigh">
					{message}
				</Text>
			</Stack>

			{(retry || actions) && (
				<div className={css.actions}>
					{retry}
					{actions}
				</div>
			)}
		</div>
	);

	if (!standalone) {
		return block;
	}

	return (
		<>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{headerTitle ?? m['common.error.heading']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			{block}
		</>
	);
}
