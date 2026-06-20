import { useMemo } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { useLanguagePrefs } from '#/state/preferences';

import { languageName } from '#/locale/helpers';
import { APP_LANGUAGES, LANGUAGES } from '#/locale/languages';

import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon } from '#/components/icons/Chevron';
import { Earth_Stroke2_Corner0_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Menu from '#/components/web/Menu';

export function SearchLanguageDropdown({
	value,
	onChange,
}: {
	value: string;
	onChange(value: string): void;
}) {
	const { t: l } = useLingui();
	const { appLanguage, contentLanguages, primaryLanguage } = useLanguagePrefs();

	const languages = useMemo(() => {
		return LANGUAGES.filter(
			(lang, index, self) =>
				Boolean(lang.code2) && // reduce to the code2 varieties
				index === self.findIndex((t) => t.code2 === lang.code2), // remove dupes (which will happen)
		)
			.map((l) => ({
				label: languageName(l, appLanguage),
				value: l.code2,
				key: l.code2 + l.code3,
			}))
			.sort((a, b) => {
				// prioritize user's languages
				const aIsUser = contentLanguages.includes(a.value);
				const bIsUser = contentLanguages.includes(b.value);
				if (aIsUser && !bIsUser) return -1;
				if (bIsUser && !aIsUser) return 1;
				// prioritize "common" langs in the network
				const aIsCommon = !!APP_LANGUAGES.find(
					(al) =>
						// skip `ast`, because it uses a 3-letter code which conflicts with `as`
						// it begins with `a` anyway so still is top of the list
						(al.code2 as string) !== 'ast' && al.code2.startsWith(a.value),
				);
				const bIsCommon = !!APP_LANGUAGES.find(
					(al) =>
						// ditto
						(al.code2 as string) !== 'ast' && al.code2.startsWith(b.value),
				);
				if (aIsCommon && !bIsCommon) return -1;
				if (bIsCommon && !aIsCommon) return 1;
				// fall back to alphabetical
				return a.label.localeCompare(b.label, primaryLanguage);
			});
	}, [appLanguage, contentLanguages, primaryLanguage]);

	const currentLanguageLabel = languages.find((lang) => lang.value === value)?.label ?? l`All languages`;

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						label={l`Filter search by language (currently: ${currentLanguageLabel})`}
						size="small"
						color="secondary"
						variant="solid"
					>
						<ButtonIcon icon={EarthIcon} />
						<ButtonText>{currentLanguageLabel}</ButtonText>
						<ButtonIcon icon={ChevronDownIcon} />
					</Button>
				}
			/>
			<Menu.Popup label={l`Filter search by language`}>
				<Menu.Group>
					<Menu.LabelText>
						<Trans>Filter search by language</Trans>
					</Menu.LabelText>
					<Menu.Item label={l`All languages`} onClick={() => onChange('')}>
						<Menu.ItemText>
							<Trans>All languages</Trans>
						</Menu.ItemText>
						<Menu.ItemRadio selected={value === ''} />
					</Menu.Item>
				</Menu.Group>
				<Menu.Separator />
				<Menu.Group>
					{languages.map((lang) => (
						<Menu.Item key={lang.key} label={lang.label} onClick={() => onChange(lang.value)}>
							<Menu.ItemText>{lang.label}</Menu.ItemText>
							<Menu.ItemRadio selected={value === lang.value} />
						</Menu.Item>
					))}
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
