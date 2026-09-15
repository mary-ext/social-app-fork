import { clsx } from 'clsx';

import { Text } from '#/components/Text';
import { Button, type ButtonProps } from '#/components/web/Button';

import GlobeIcon from '#/icons/central/Globe_round_outlined_radius1_stroke2.svg';

import * as css from './LanguageButton.css';

/** displays selected language codes, or a globe when none are selected. */
export function LanguageButton({
	currentLanguages,
	className,
	...props
}: Omit<ButtonProps, 'children' | 'shape' | 'size' | 'variant'> & {
	currentLanguages: string[];
}) {
	return (
		<Button variant="ghost" size="small" className={clsx(css.button, className)} {...props}>
			{currentLanguages.length > 0 ? (
				<Text className={css.text} color="primary_600" size="md_sub" weight="semiBold">
					{currentLanguages.join(', ')}
				</Text>
			) : (
				<GlobeIcon className={css.globeIcon} />
			)}
		</Button>
	);
}
