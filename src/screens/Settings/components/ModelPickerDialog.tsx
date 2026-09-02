import { useRef, useState } from 'react';

import { Combobox } from '@base-ui/react/combobox';
import { clsx } from 'clsx';

import type { AiModelSelection, AiProviderConfigs } from '#/lib/ai/config';
import type { AiModality, AiModelOffer } from '#/lib/lexicons';

import { useAiModelsQuery } from '#/state/queries/ai-catalog';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import * as SearchField from '#/components/forms/SearchField';
import type { ListMethods } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import RobotIcon from '#/icons/central/Robot_round_outlined_radius0_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './ModelPickerDialog.css';

const NONE = 'none';

const MODEL_ITEM_HEIGHT_ESTIMATE = 66;

type Entry = {
	id: string;
	name: string;
	detail?: string;
};

const offerKey = (offer: Pick<AiModelOffer, 'endpoint' | 'model' | 'provider'>): string => {
	return `${offer.provider} ${offer.model} ${offer.endpoint}`;
};

type Props = {
	handle: Dialog.DialogHandle;
	inputModalities: AiModality[];
	onSave: (selection: AiModelSelection | undefined) => void;
	providers: AiProviderConfigs;
	selection: AiModelSelection | undefined;
	titleText: string;
};

/**
 * renders the model picker.
 *
 * @param props dialog state and model filters
 * @returns the model picker dialog
 */
export const ModelPickerDialog = ({ handle, ...props }: Props) => {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} scroll="body" label={props.titleText}>
				<DialogInner {...props} close={() => handle.close()} />
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const DialogInner = ({
	close,
	inputModalities,
	onSave,
	providers,
	selection,
	titleText,
}: Omit<Props, 'handle'> & { close: () => void }) => {
	// catalog offers use models.dev ids; selections use device-local ids.
	const linked = new Map<string, { id: string; name: string }>(
		Object.entries(providers).flatMap(([id, config]) => {
			return config.modelsDevId === undefined ? [] : [[config.modelsDevId, { id: id, name: config.name }]];
		}),
	);

	const {
		data: offers,
		error,
		isPending,
	} = useAiModelsQuery({
		inputModalities: inputModalities,
		outputModalities: ['text'],
		providers: [...linked.keys()],
	});

	const saved = selection !== undefined ? providers[selection.provider] : undefined;
	const savedKey =
		selection !== undefined && saved?.modelsDevId !== undefined
			? offerKey({ ...selection, provider: saved.modelsDevId })
			: NONE;

	const [selected, setSelected] = useState(savedKey);
	const [search, setSearch] = useState('');
	const listRef = useRef<ListMethods>(null);

	const byKey = new Map((offers ?? []).map((offer) => [offerKey(offer), offer]));

	const onClose = () => {
		const offer = byKey.get(selected);
		const provider = offer && linked.get(offer.provider);
		if (offer !== undefined && provider !== undefined) {
			onSave({
				endpoint: offer.endpoint,
				model: offer.model,
				name: offer.name,
				provider: provider.id,
				supportsTemperature: offer.capabilities.temperature,
			});
		} else if (selected !== savedKey) {
			onSave(undefined);
		}

		close();
	};

	const entries: Entry[] = [{ id: NONE, name: m['screens.settings.ai.model.none']() }];
	// retain a saved choice missing from the current catalog.
	if (selection !== undefined && saved !== undefined && savedKey !== NONE && !byKey.has(savedKey)) {
		entries.push({
			id: savedKey,
			name: selection.name,
			detail: describe(saved.name, selection.model),
		});
	}
	for (const [key, offer] of byKey) {
		const provider = linked.get(offer.provider);
		if (provider === undefined) {
			continue;
		}

		entries.push({ id: key, name: offer.name, detail: describe(provider.name, offer.model) });
	}
	const selectedEntry = entries.find((entry) => entry.id === selected) ?? null;

	const needle = search.trim().toLowerCase();
	const visible = entries.filter((entry) => {
		return entry.name.toLowerCase().includes(needle) || entry.detail?.toLowerCase().includes(needle) === true;
	});

	const hasProviders = linked.size > 0;
	const statusText = !hasProviders || error === null ? undefined : m['screens.settings.ai.model.loadError']();
	const isLoading = hasProviders && isPending;
	const listEntries = isLoading || !hasProviders ? [] : visible;
	const emptyIcon = hasProviders ? MagnifyingGlassIcon : RobotIcon;
	const emptyMessage = hasProviders
		? m['screens.settings.ai.model.noMatches']()
		: m['screens.settings.ai.model.needsProvider']();

	return (
		<Combobox.Root
			autoHighlight
			filter={null}
			inline
			inputValue={search}
			isItemEqualToValue={(entry, value) => entry.id === value.id}
			items={listEntries}
			itemToStringLabel={(entry) => entry.name}
			itemToStringValue={(entry) => entry.id}
			onInputValueChange={(value, details) => {
				if (details.reason === 'input-change') {
					setSearch(value);
					listRef.current?.scrollToTop();
				}
			}}
			onValueChange={(entry) => setSelected(entry?.id ?? NONE)}
			open
			value={selectedEntry}
			virtualized
		>
			<div className={styles.header}>
				<Text className={styles.title} size="lg" weight="semiBold" numberOfLines={1}>
					{titleText}
				</Text>

				<Button
					className={styles.closeButton}
					color="secondary"
					label={m['common.a11y.closeDialog']()}
					onClick={onClose}
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
					<Combobox.Input
						render={
							<SearchField.Input
								aria-label={m['screens.settings.ai.model.search']()}
								autoFocus
								maxLength={50}
								placeholder={m['screens.settings.ai.model.search']()}
							/>
						}
					/>
					{search.length > 0 && (
						<SearchField.Clear label={m['common.search.action.clear']()} onClick={() => setSearch('')} />
					)}
				</SearchField.Root>
			</div>

			<Combobox.List className={styles.comboboxList}>
				<Dialog.List
					className={styles.list}
					data={listEntries}
					estimateHeight={MODEL_ITEM_HEIGHT_ESTIMATE}
					keyExtractor={(entry) => entry.id}
					ListHeaderComponent={
						<>
							{isLoading && <CenteredSpinner label={m['screens.settings.ai.model.loading']()} size="xl" />}
							{statusText !== undefined && (
								<Text className={styles.status} color="textContrastMedium" size="sm">
									{statusText}
								</Text>
							)}
							<Combobox.Empty>
								{!isLoading && statusText === undefined && (
									<ListEmpty icon={emptyIcon} message={emptyMessage} />
								)}
							</Combobox.Empty>
						</>
					}
					ref={listRef}
					renderItem={({ index, item: entry }) => (
						<Combobox.Item
							aria-posinset={index + 1}
							aria-setsize={listEntries.length}
							className={clsx(styles.item, index !== listEntries.length - 1 && styles.itemBorder)}
							index={index}
							value={entry}
						>
							<div className={styles.itemText}>
								<Text color="textContrastHigh" numberOfLines={1} weight="semiBold">
									{entry.name}
								</Text>
								{entry.detail !== undefined && (
									<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
										{entry.detail}
									</Text>
								)}
							</div>

							<Combobox.ItemIndicator>
								<CheckIcon className={styles.checkIcon} />
							</Combobox.ItemIndicator>
						</Combobox.Item>
					)}
				/>
			</Combobox.List>

			<Dialog.Footer>
				<Button
					className={styles.doneButton}
					color="primary"
					label={m['common.action.done']()}
					onClick={onClose}
					size="large"
				>
					<ButtonText>{m['common.action.done']()}</ButtonText>
				</Button>
			</Dialog.Footer>
		</Combobox.Root>
	);
};

const describe = (providerName: string, model: string): string => {
	return m['screens.settings.ai.model.route']({ model: model, provider: providerName });
};
