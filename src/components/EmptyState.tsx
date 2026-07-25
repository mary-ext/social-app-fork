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

export type EmptyStateButtonProps = {
	color?: ButtonColor;
	icon?: EmptyStateIcon;
	iconPosition?: 'left' | 'right';
	label: string;
	onPress: () => void;
	size?: ButtonSize;
	text: string;
};

export type EmptyStateIcon = ComponentType<IconProps>;

export function EmptyState({
	button,
	className,
	icon,
	iconColor,
	iconSize = '3xl',
	message,
	messageColor = 'textContrastHigh',
}: {
	button?: EmptyStateButtonProps;
	className?: string;
	icon?: EmptyStateIcon | ReactElement | null;
	iconColor?: string;
	iconSize?: IconProps['size'];
	message: string;
	messageColor?: TextProps['color'];
}) {
	const renderIcon = () => {
		if (icon === null) {
			return null;
		}
		if (!icon) {
			return <EditIcon fill={colors.textContrastMedium} size="3xl" />;
		}
		if (isValidElement(icon)) {
			return icon;
		}
		const IconComponent = icon;
		return <IconComponent fill={iconColor ?? colors.textContrastLow} size={iconSize} />;
	};

	const renderButton = () => {
		if (!button) {
			return null;
		}
		const { color, icon: buttonIcon, iconPosition = 'left', label, onPress, size = 'small', text } = button;

		return (
			<div className={css.buttonWrap}>
				<Button color={color} label={label} onClick={onPress} size={size}>
					{buttonIcon && iconPosition === 'left' && <ButtonIcon icon={buttonIcon} />}
					<ButtonText>{text}</ButtonText>
					{buttonIcon && iconPosition === 'right' && <ButtonIcon icon={buttonIcon} />}
				</Button>
			</div>
		);
	};

	return (
		<div className={clsx(css.root, className)}>
			<div className={css.iconBox}>{renderIcon()}</div>
			<Text align="center" className={css.message} color={messageColor} size="md" weight="medium">
				{message}
			</Text>

			{renderButton()}
		</div>
	);
}
