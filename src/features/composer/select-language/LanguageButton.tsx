import { clsx } from 'clsx';

import { toPostLanguages, usePostLanguage } from '#/state/preferences/languages';

import { Text } from '#/components/Text';
import { Button, type ButtonProps } from '#/components/web/Button';

import GlobeIcon from '#/icons/central/Globe_round_outlined_radius1_stroke2.svg';

import * as css from './LanguageButton.css';

/**
 * displays the selected language code(s) or a globe icon if none are selected. flashes a transient pulse when
 * `nudgeAt` changes. forwards a ref to the underlying web `Button` and can trigger a Base UI Menu.
 */
export function LanguageButton({
	currentLanguages,
	nudgeAt = 0,
	className,
	...props
}: Omit<ButtonProps, 'children' | 'shape' | 'size' | 'variant'> & {
	currentLanguages?: string[];
	/** Timestamp (ms) of the last honored language-detection nudge; each change replays the pulse. */
	nudgeAt?: number;
}) {
	const postLanguage = usePostLanguage();
	const languages = currentLanguages ?? toPostLanguages(postLanguage);

	return (
		<Button variant="ghost" size="small" className={clsx(css.button, className)} {...props}>
			{nudgeAt > 0 && <span key={nudgeAt} className={css.pulseOverlay} />}
			{languages.length > 0 ? (
				<Text className={css.text} color="primary_600" size="md_sub" weight="semiBold">
					{languages.join(', ')}
				</Text>
			) : (
				<GlobeIcon className={css.globeIcon} />
			)}
		</Button>
	);
}
