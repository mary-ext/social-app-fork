import { LOCALE, setAppLanguage } from '#/locale/intl/locale';
import { APP_LANGUAGES } from '#/locale/languages';

import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import * as Select from '#/components/Select';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import type { Locale } from '#/paraglide/runtime';

import * as styles from './AppLanguageDropdown.css';

const onChangeAppLanguage = (value: Locale) => {
	if (value !== LOCALE) {
		setAppLanguage(value);
	}
};

export function AppLanguageDropdown() {
	const items = APP_LANGUAGES.map((language) => ({
		label: language.name,
		value: language.code2,
	}));

	return (
		<Select.Root items={items} onValueChange={onChangeAppLanguage} value={LOCALE}>
			<Select.Trigger
				render={
					<Button
						className={styles.trigger}
						color="secondary"
						label={m['components.appLanguageDropdown.a11y.change']()}
						shape="rectangular"
						size="tiny"
						variant="ghost"
					/>
				}
			>
				<ButtonIcon icon={EarthIcon} size="sm" />
				<Select.Value
					className={styles.value}
					placeholder={m['components.appLanguageDropdown.a11y.select']()}
				/>
				<Select.Icon className={styles.icon} />
			</Select.Trigger>
			<Select.Content
				items={items}
				renderItem={({ label, value }) => (
					<Select.Item label={label} value={value}>
						<Select.ItemIndicator />
						<Select.ItemText>{label}</Select.ItemText>
					</Select.Item>
				)}
			/>
		</Select.Root>
	);
}
