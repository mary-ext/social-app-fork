import { useState } from 'react';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import type { AiProviderConfigs } from '#/lib/ai/config';
import type { AiProvider } from '#/lib/lexicons';

import { useAiProvidersQuery } from '#/state/queries/ai-catalog';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import * as SearchField from '#/components/forms/SearchField';
import { ListEmpty } from '#/components/List/ListEmpty';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './AiProviderPickerDialog.css';

type Props = {
	configured: AiProviderConfigs;
	handle: Dialog.DialogHandle;
	onPick: (provider: AiProvider) => void;
};

/**
 * renders the provider picker.
 *
 * @param props dialog state and provider selection handler
 * @returns the provider picker dialog
 */
export const AiProviderPickerDialog = ({ handle, ...props }: Props) => {
	const titleText = m['screens.settings.ai.provider.addTitle']();

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} scroll="body" label={titleText}>
				<DialogInner {...props} close={() => handle.close()} titleText={titleText} />
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const DialogInner = ({
	close,
	configured,
	onPick,
	titleText,
}: Omit<Props, 'handle'> & { close: () => void; titleText: string }) => {
	const { data: providers, error, isPending } = useAiProvidersQuery();

	const [search, setSearch] = useState('');

	const taken = new Set(Object.values(configured).map((config) => config.modelsDevId));
	const offered = (providers ?? []).filter((provider) => !taken.has(provider.id));

	const needle = search.trim().toLowerCase();
	const visible = offered.filter((provider) => {
		return provider.name.toLowerCase().includes(needle) || provider.id.toLowerCase().includes(needle);
	});

	let statusText: string | undefined;
	if (error !== null) {
		statusText = m['screens.settings.ai.provider.loadError']();
	} else if (!isPending && offered.length === 0) {
		statusText = m['screens.settings.ai.provider.allAdded']();
	}

	return (
		<Autocomplete.Root
			autoHighlight="always"
			filter={null}
			inline
			items={visible}
			itemToStringValue={(provider) => provider.name}
			onValueChange={(value, details) => {
				// do not replace the query with the selected label while the dialog closes.
				if (details.reason !== 'item-press') {
					setSearch(value);
				}
			}}
			open
			value={search}
		>
			<div className={styles.header}>
				<Text className={styles.title} size="lg" weight="semiBold" numberOfLines={1}>
					{titleText}
				</Text>

				<Button
					className={styles.closeButton}
					color="secondary"
					label={m['common.a11y.closeDialog']()}
					onClick={close}
					shape="round"
					size="small"
					variant="ghost"
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>

			<div className={styles.search}>
				<SearchField.Root>
					<SearchField.Icon />
					<Autocomplete.Input
						render={
							<SearchField.Input
								aria-label={m['screens.settings.ai.provider.search']()}
								autoFocus
								maxLength={50}
								placeholder={m['screens.settings.ai.provider.search']()}
							/>
						}
					/>
					<Autocomplete.Clear render={<SearchField.Clear label={m['common.search.action.clear']()} />} />
				</SearchField.Root>
			</div>

			<Dialog.Body className={styles.list} tabIndex={-1}>
				<Autocomplete.List>
					{isPending && <CenteredSpinner label={m['screens.settings.ai.provider.loading']()} size="xl" />}

					{statusText !== undefined && (
						<Text className={styles.status} color="textContrastMedium" size="sm">
							{statusText}
						</Text>
					)}

					<Autocomplete.Empty>
						{!isPending && statusText === undefined && (
							<ListEmpty icon={MagnifyingGlassIcon} message={m['screens.settings.ai.provider.noMatches']()} />
						)}
					</Autocomplete.Empty>

					{visible.map((provider, index) => (
						<Autocomplete.Item
							className={clsx(styles.item, index !== visible.length - 1 && styles.itemBorder)}
							key={provider.id}
							onClick={() => {
								onPick(provider);
								close();
							}}
							value={provider}
						>
							<Text color="textContrastHigh" numberOfLines={1} weight="semiBold">
								{provider.name}
							</Text>
							<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
								{provider.id}
							</Text>
						</Autocomplete.Item>
					))}
				</Autocomplete.List>
			</Dialog.Body>
		</Autocomplete.Root>
	);
};
