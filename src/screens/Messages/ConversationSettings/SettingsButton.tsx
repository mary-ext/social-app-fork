import type { ComponentType } from 'react';

import { clsx } from 'clsx';

import type { Props as SVGIconProps } from '#/components/icons/common';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, type ButtonProps } from '#/components/web/Button';

import * as styles from './SettingsButton.css';

type SettingsButtonProps = Omit<ButtonProps, 'children' | 'shape' | 'size'> & {
	icon: ComponentType<SVGIconProps>;
	text: string;
};

/**
 * Renders a round conversation-setting action with its label.
 *
 * @param props Button properties, icon, and visible label.
 * @returns The setting action button and label.
 */
export function SettingsButton({
	className,
	color = 'secondary',
	icon,
	text,
	...props
}: SettingsButtonProps) {
	return (
		<div className={styles.root}>
			<Button
				className={clsx(styles.button, className)}
				color={color}
				shape="round"
				size="large"
				variant="solid"
				{...props}
			>
				<ButtonIcon icon={icon} size="md" />
			</Button>
			<Text align="center" className={styles.label} numberOfLines={1} size="xs" weight="medium">
				{text}
			</Text>
		</div>
	);
}
