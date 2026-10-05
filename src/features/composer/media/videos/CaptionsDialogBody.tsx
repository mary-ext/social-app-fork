import { type DragEvent, type ReactNode, useId, useState } from 'react';

import { mapDefined } from '@mary/array-fns';

import { openCaptionPicker } from '#/lib/media/picker';

import { usePrimaryLanguage } from '#/state/preferences/languages';

import { codeToLanguageName, resolveLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';
import { LANGUAGES, langCode } from '#/locale/languages';
import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import * as Select from '#/components/Select';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import PageTextIcon from '#/icons/central/PageText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { isFileDrag } from '../../dnd/drop-targets';
import {
	type CaptionProblem,
	type CaptionTrack,
	getCaptionProblem,
	inferCaptionLanguage,
	MAX_CAPTION_SIZE,
	MAX_CAPTION_TRACKS,
} from './captions';
import * as css from './CaptionsDialogBody.css';

const byteFormat = new Intl.NumberFormat(LOCALE, { style: 'unit', unit: 'byte', unitDisplay: 'long' });
const kilobyteFormat = new Intl.NumberFormat(LOCALE, {
	style: 'unit',
	unit: 'kilobyte',
	maximumFractionDigits: 1,
});

const formatSize = (bytes: number): string => {
	return bytes < 1000 ? byteFormat.format(bytes) : kilobyteFormat.format(bytes / 1000);
};

const languageItems = mapDefined(LANGUAGES, (language): Select.SelectItem | undefined => {
	const label = resolveLanguageName(language, LOCALE);
	return label ? { label, value: langCode(language) } : undefined;
}).toSorted((a, b) => a.label.localeCompare(b.label, LOCALE));

/**
 * caption file and language editor.
 *
 * @param props.initialTracks tracks when the dialog opened
 * @param props.onSave receives the edited tracks
 * @returns the editor
 */
export const CaptionsDialogBody = ({
	initialTracks,
	onSave,
}: {
	initialTracks: readonly CaptionTrack[];
	onSave: (tracks: readonly CaptionTrack[]) => void;
}): ReactNode => {
	const primaryLanguage = usePrimaryLanguage();

	const [tracks, setTracks] = useState(initialTracks);
	const [isDragging, setIsDragging] = useState(false);

	const problems = tracks.map((track) => getCaptionProblem(track, tracks));
	const isFull = tracks.length >= MAX_CAPTION_TRACKS;
	const canSave = tracks !== initialTracks && problems.every((problem) => problem === null);

	const addFiles = (files: File[]) => {
		const room = MAX_CAPTION_TRACKS - tracks.length;
		if (files.length > room) {
			Toast.show(m['features.composer.captions.error.maxFiles']({ max: MAX_CAPTION_TRACKS }));
		}

		const next = [...tracks];
		for (const file of files.slice(0, Math.max(room, 0))) {
			const inferred = inferCaptionLanguage(file.name);
			const fallback = next.some((track) => track.lang === primaryLanguage) ? '' : primaryLanguage;
			next.push({ id: crypto.randomUUID(), file, lang: inferred ?? fallback });
		}

		if (next.length !== tracks.length) {
			setTracks(next);
		}
	};

	const dragOver = (event: DragEvent) => {
		if (!isFileDrag(event.dataTransfer)) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = isFull ? 'none' : 'copy';
		setIsDragging(!isFull);
	};

	const dragLeave = (event: DragEvent) => {
		if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
			setIsDragging(false);
		}
	};

	const drop = (event: DragEvent) => {
		if (!isFileDrag(event.dataTransfer)) {
			return;
		}

		event.preventDefault();
		setIsDragging(false);
		addFiles([...event.dataTransfer.files]);
	};

	return (
		<>
			<Dialog.Header.Root>
				<Dialog.Header.Close />
				<Dialog.Header.Title>{m['features.composer.captions.title']()}</Dialog.Header.Title>
				<Dialog.Header.Actions>
					<Button
						color="primary"
						disabled={!canSave}
						label={m['common.action.save']()}
						onClick={() => onSave(tracks)}
						size="small"
					>
						<ButtonText>{m['common.action.save']()}</ButtonText>
					</Button>
				</Dialog.Header.Actions>
			</Dialog.Header.Root>

			<Dialog.Body className={css.body} onDragLeave={dragLeave} onDragOver={dragOver} onDrop={drop}>
				<Text color="textContrastMedium" leading="snug">
					{m['features.composer.captions.hint']({ size: formatSize(MAX_CAPTION_SIZE) })}
				</Text>

				{tracks.length > 0 && (
					<div className={css.list}>
						{tracks.map((track, index) => (
							<TrackRow
								key={track.id}
								track={track}
								problem={problems[index] ?? null}
								onLanguageChange={(lang) => {
									setTracks(tracks.map((other) => (other === track ? { ...other, lang } : other)));
								}}
								onRemove={() => {
									setTracks(tracks.filter((other) => other !== track));
								}}
							/>
						))}
					</div>
				)}

				{!isFull && (
					<div className={css.dropZone({ active: isDragging })}>
						{isDragging ? (
							<Text color="primary_500" weight="semiBold">
								{m['features.composer.captions.dropToAdd']()}
							</Text>
						) : (
							// the markup renders its text in <Text>; a bare space between the tags is dropped by flex layout.
							// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
							<Trans
								message={m['features.composer.captions.dropHint']}
								markup={{
									t0: ({ children }) => <Text color="textContrastMedium">{children}</Text>,
									t1: ({ children }) => (
										<Button
											color="secondary"
											label={m['features.composer.captions.action.choose']()}
											onClick={() => void openCaptionPicker().then(addFiles)}
											size="small"
											variant="outline"
										>
											<ButtonText>{children}</ButtonText>
										</Button>
									),
								}}
							/>
						)}
					</div>
				)}
			</Dialog.Body>
		</>
	);
};

const getProblemMessage = (problem: CaptionProblem, track: CaptionTrack): string => {
	switch (problem) {
		case 'notVtt': {
			return m['features.composer.captions.error.vttOnly']();
		}
		case 'tooLarge': {
			return m['features.composer.captions.error.tooLarge']({ size: formatSize(MAX_CAPTION_SIZE) });
		}
		case 'noLanguage': {
			return m['features.composer.captions.error.languageRequired']();
		}
		case 'duplicateLanguage': {
			return m['features.composer.captions.error.duplicateLanguage']({
				language: codeToLanguageName(track.lang, LOCALE),
			});
		}
	}
};

const TrackRow = ({
	track,
	problem,
	onLanguageChange,
	onRemove,
}: {
	track: CaptionTrack;
	problem: CaptionProblem | null;
	onLanguageChange: (lang: string) => void;
	onRemove: () => void;
}): ReactNode => {
	const messageId = useId();
	const isLanguageProblem = problem === 'noLanguage' || problem === 'duplicateLanguage';

	return (
		<div className={css.row}>
			<PageTextIcon className={css.icon} />

			<div className={css.name}>
				<Text weight="semiBold" leading="snug" numberOfLines={1}>
					{track.file.name}
				</Text>
				<Text size="sm" leading="snug" color="textContrastMedium">
					{formatSize(track.file.size)}
				</Text>
			</div>

			{problem !== 'notVtt' && (
				<div className={css.language}>
					<Select.Root
						items={languageItems}
						value={track.lang}
						onValueChange={(lang) => {
							if (lang) {
								onLanguageChange(lang);
							}
						}}
					>
						<Select.Trigger
							describedBy={isLanguageProblem ? messageId : undefined}
							isInvalid={isLanguageProblem}
							label={m['features.composer.captions.selectLanguage']()}
						>
							<Select.Value placeholder={m['features.composer.captions.selectLanguage']()} />
							<Select.Icon />
						</Select.Trigger>
						<Select.Content
							items={languageItems}
							renderItem={({ label, value }) => (
								<Select.Item label={label} value={value}>
									<Select.ItemIndicator />
									<Select.ItemText>{label}</Select.ItemText>
								</Select.Item>
							)}
						/>
					</Select.Root>
				</div>
			)}

			<Button
				className={css.remove}
				color="secondary"
				label={m['features.composer.captions.action.remove']()}
				onClick={onRemove}
				shape="round"
				size="tiny"
				variant="ghost"
			>
				<ButtonIcon icon={XIcon} />
			</Button>

			{problem && (
				<div className={css.message} id={messageId}>
					<WarningIcon className={css.messageIcon} />
					<Text size="sm" leading="snug" color="negative_600">
						{getProblemMessage(problem, track)}
					</Text>
				</div>
			)}
		</div>
	);
};
