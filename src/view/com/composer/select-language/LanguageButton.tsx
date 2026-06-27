import { clsx } from 'clsx';

import { toPostLanguages, useLanguagePrefs } from '#/state/preferences/languages';

import { codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import { Button, type ButtonProps } from '#/components/web/Button';

import * as styles from './LanguageButton.css';

/**
 * The composer's post-language button: shows the selected language name(s) (or a globe when none), and
 * flashes a transient pulse each time `nudgeAt` changes. Built on the web `Button` (`bare`/`small`) so it
 * forwards a ref and can back a Base UI Menu `Trigger`.
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
	const langPrefs = useLanguagePrefs();
	const languages = currentLanguages ?? toPostLanguages(langPrefs.postLanguage);

	return (
		<Button variant="bare" size="small" className={clsx(styles.button, className)} {...props}>
			{nudgeAt > 0 && <span key={nudgeAt} className={styles.pulseOverlay} />}
			{languages.length > 0 ? (
				<span className={styles.langText}>
					{languages.map((lang) => codeToLanguageName(lang, LOCALE)).join(', ')}
				</span>
			) : (
				<GlobeIcon size="xs" fill="currentColor" />
			)}
		</Button>
	);
}
