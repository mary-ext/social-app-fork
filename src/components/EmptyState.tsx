import { type ComponentProps, type ComponentType, isValidElement, type ReactElement, type SVGProps } from 'react';

import { clsx } from 'clsx';

import EditIcon from '#/icons/central/EditBig_round_outlined_radius3_stroke1.svg';
import { Text, type TextProps } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import type { iconSize as iconSizeToken } from '#/styles/tokens.css';

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

export type EmptyStateIcon = ComponentType<SVGProps<SVGSVGElement>>;

export function EmptyState({
	button,
	className,
	icon,
	iconColor,
	iconSize = '_3xl',
	message,
	messageColor = 'textContrastHigh',
}: {
	button?: EmptyStateButtonProps;
	className?: string;
	icon?: EmptyStateIcon | ReactElement | null;
	iconColor?: string;
	iconSize?: keyof typeof iconSizeToken;
	message: string;
	messageColor?: TextProps['color'];
}) {
	const renderIcon = () => {
		if (icon === null) {
			return null;
		}
		if (!icon) {
			return <EditIcon className={clsx(css.icon._3xl, css.fallbackIcon)} />;
		}
		if (isValidElement(icon)) {
			return icon;
		}
		const IconComponent = icon;
		// the color is caller-supplied at runtime, so it cannot be a static class
		return <IconComponent className={css.icon[iconSize]} style={iconColor ? { color: iconColor } : undefined} />;
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
