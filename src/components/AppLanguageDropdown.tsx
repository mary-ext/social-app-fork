import { LOCALE, setAppLanguage } from '#/locale/intl/locale';
import { APP_LANGUAGES } from '#/locale/languages';

import * as Select from '#/components/Select';
import { Button } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import type { Locale } from '#/paraglide/runtime';

import * as styles from './AppLanguageDropdown.css';

export function AppLanguageDropdown() {
	const onChangeAppLanguage = (value: string) => {
		if (value && value !== LOCALE) {
			setAppLanguage(value as Locale);
		}
	};

	const items = APP_LANGUAGES.map((language) => ({
		label: language.name,
		value: language.code2,
	}));

	return (
		<Select.Root items={items} value={LOCALE} onValueChange={onChangeAppLanguage}>
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
