import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences';
import { resetPostsFeedQueries } from '#/state/queries/post-feed';

import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { APP_LANGUAGES } from '#/locale/languages';

import * as Select from '#/components/Select';
import { Button } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './AppLanguageDropdown.css';

export function AppLanguageDropdown() {
	const queryClient = useQueryClient();
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();
	const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage);

	const onChangeAppLanguage = useCallback(
		(value: string) => {
			if (!value) {
				return;
			}

			const next = sanitizeAppLanguageSetting(value);
			if (sanitizedLang !== next) {
				setLangPrefs.setAppLanguage(next);
			}

			resetPostsFeedQueries(queryClient);
		},
		[queryClient, sanitizedLang, setLangPrefs],
	);

	const items = APP_LANGUAGES.map((language) => ({
		label: language.name,
		value: language.code2,
	}));

	return (
		<Select.Root items={items} value={sanitizedLang} onValueChange={onChangeAppLanguage}>
			<Select.Trigger
				render={
					<Button
						label={m['components.appLanguageDropdown.a11y.change']()}
						variant="ghost"
						color="secondary"
						size="tiny"
						shape="rectangular"
						className={styles.trigger}
					/>
				}
			>
				<Select.Value
					placeholder={m['components.appLanguageDropdown.a11y.select']()}
					className={styles.value}
				/>
				<Select.Icon className={styles.icon} />
			</Select.Trigger>
			<Select.Content
				items={items}
				renderItem={({ label, value }) => (
					<Select.Item value={value} label={label}>
						<Select.ItemIndicator />
						<Select.ItemText>{label}</Select.ItemText>
					</Select.Item>
				)}
			/>
		</Select.Root>
	);
}
