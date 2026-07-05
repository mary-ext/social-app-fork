import { type ComponentProps, type ComponentType, isValidElement, type ReactElement } from 'react';

import { clsx } from 'clsx';

import type { Props as IconProps } from '#/components/icons/common';
import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import { Text, type TextProps } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { colors } from '#/styles/colors';

import * as css from './EmptyState.css';

type ButtonColor = NonNullable<ComponentProps<typeof Button>['color']>;
type ButtonSize = NonNullable<ComponentProps<typeof Button>['size']>;

export type EmptyStateIcon = ComponentType<IconProps>;

export type EmptyStateButtonProps = {
	color?: ButtonColor;
	icon?: EmptyStateIcon;
	label: string;
	onPress: () => void;
	size?: ButtonSize;
	text: string;
};

export function EmptyState({
	icon,
	iconSize = '3xl',
	iconColor,
	message,
	messageColor = 'textContrastHigh',
	button,
	className,
}: {
	icon?: EmptyStateIcon | ReactElement | null;
	iconSize?: IconProps['size'];
	iconColor?: string;
	message: string;
	messageColor?: TextProps['color'];
	button?: EmptyStateButtonProps;
	className?: string;
}) {
	const renderIcon = () => {
		if (icon === null) {
			return null;
		}
		if (!icon) {
			return <EditIcon size="3xl" fill={colors.textContrastMedium} />;
		}
		if (isValidElement(icon)) {
			return icon;
		}
		const IconComponent = icon;
		return <IconComponent size={iconSize} fill={iconColor ?? colors.textContrastLow} />;
	};

	return (
		<div className={clsx(css.root, className)}>
			<div className={css.iconBox}>{renderIcon()}</div>
			<Text className={clsx(css.message)} size="md" weight="medium" color={messageColor} align="center">
				{message}
			</Text>

			{button && (
				<div className={css.buttonWrap}>
					<Button
						label={button.label}
						onClick={button.onPress}
						size={button.size ?? 'small'}
						color={button.color}
					>
						{button.icon && <ButtonIcon icon={button.icon} />}
						<ButtonText>{button.text}</ButtonText>
					</Button>
				</div>
			)}
		</div>
	);
}
