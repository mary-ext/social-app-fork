import { useState } from 'react';

import { clsx } from 'clsx';

import { setImageDescriptionModel } from '#/state/preferences/openrouter';
import { useOpenRouterModelsQuery } from '#/state/queries/openrouter-models';

import * as Dialog from '#/components/Dialog';
import { SearchInput } from '#/components/forms/SearchInput';
import * as Toggle from '#/components/forms/Toggle';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './ImageDescriptionModelDialog.css';

const NONE = 'none';

type Entry = {
	id: string;
	name: string;
};

type Props = {
	handle: Dialog.DialogHandle;
	/** The currently saved model id, or undefined when image description is off. */
	model: string | undefined;
};

export function ImageDescriptionModelDialog({ handle, model }: Props) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} scroll="body" label={m['screens.settings.ai.model.label']()}>
				<DialogInner handle={handle} model={model} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, model }: Props) {
	const {
		data: models,
		error,
		isPending,
	} = useOpenRouterModelsQuery({
		inputModalities: ['image', 'text'],
		outputModalities: ['text'],
	});

	const [selected, setSelected] = useState(model ?? NONE);
	const [search, setSearch] = useState('');

	const onClose = () => {
		setImageDescriptionModel(selected === NONE ? undefined : selected);
		handle.close();
	};

	const entries: Entry[] = [
		{ id: NONE, name: m['screens.settings.ai.model.none']() },
		...(models ?? []).map((entry) => ({ id: entry.id, name: entry.name })),
	];
	// a saved model stays visible and pickable even when the list failed to load or no longer carries it
	if (model !== undefined && !entries.some((entry) => entry.id === model)) {
		entries.splice(1, 0, { id: model, name: model });
	}

	const needle = search.trim().toLowerCase();
	const visible = entries.filter((entry) => {
		return entry.name.toLowerCase().includes(needle) || entry.id.toLowerCase().includes(needle);
	});

	let statusText: string | undefined;
	if (isPending) {
		statusText = m['screens.settings.ai.model.loading']();
	} else if (error !== null) {
		statusText = m['screens.settings.ai.model.loadError']();
	}

	return (
		<Toggle.Group
			className={styles.group}
			label={m['screens.settings.ai.model.label']()}
			onChange={(values) => setSelected(values[0] ?? NONE)}
			type="radio"
			values={[selected]}
		>
			<div className={styles.header}>
				<Text className={styles.title} size="lg" weight="semiBold" numberOfLines={1}>
					{m['screens.settings.ai.model.label']()}
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
				<SearchInput
					autoFocus
					label={m['screens.settings.ai.model.search']()}
					maxLength={50}
					onChangeText={setSearch}
					onClear={() => setSearch('')}
					placeholder={m['screens.settings.ai.model.search']()}
					value={search}
				/>
			</div>

			<Dialog.List
				className={styles.list}
				data={visible}
				keyExtractor={(entry) => entry.id}
				ListEmptyComponent={<Empty message={m['screens.settings.ai.model.noMatches']()} />}
				ListHeaderComponent={
					statusText !== undefined && (
						<Text className={styles.status} color="textContrastMedium" size="sm">
							{statusText}
						</Text>
					)
				}
				renderItem={(entry, index) => (
					<Toggle.RadioItem
						className={clsx(styles.item, index !== visible.length - 1 && styles.itemBorder)}
						label={entry.name}
						value={entry.id}
					>
						<div className={styles.itemText}>
							<Text color="textContrastHigh" numberOfLines={1} weight="semiBold">
								{entry.name}
							</Text>
							{entry.id !== NONE && (
								<Text color="textContrastLow" numberOfLines={1} size="md_sub">
									{entry.id}
								</Text>
							)}
						</div>
						<Toggle.RadioIndicator />
					</Toggle.RadioItem>
				)}
			/>

			<Dialog.Footer>
				<Button
					className={styles.doneButton}
					color="primary"
					label={m['common.a11y.closeDialog']()}
					onClick={onClose}
					size="large"
				>
					<ButtonText>{m['common.action.done']()}</ButtonText>
				</Button>
			</Dialog.Footer>
		</Toggle.Group>
	);
}

function Empty({ message }: { message: string }) {
	return (
		<div className={styles.empty}>
			<Text className={styles.emptyMessage} color="textContrastHigh" size="sm">
				{message}
			</Text>
			<Text color="textContrastLow" size="xs">
				(╯°□°)╯︵ ┻━┻
			</Text>
		</div>
	);
}
