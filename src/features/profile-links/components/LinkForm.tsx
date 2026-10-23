import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useDebouncedValue } from '#/lib/hooks/use-debounce';

import { fetchLinkIcon, fetchLinkPage } from '#/features/profile-links/link-data';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { formatLinkUrl, getLinkHost, normalizeProfileLinkUrl, validateLinkInput } from '../providers';
import { cleanTitle } from '../record';
import { MAX_TITLE_LENGTH, type ProfileLink } from '../types';
import * as css from './LinkForm.css';
import { ProviderLogo } from './ProviderLogo';

const SHOW_COUNTER_FROM = 20;

const SUGGEST_DELAY = 500;

// discard common site-name suffixes and truncate at a word boundary where possible.
const suggestTitle = (pageTitle: string | undefined): string => {
	const first = (pageTitle ?? '').split(/\s+[|\-–—·]\s+|:\s+/)[0]!.trim();
	if (first.length <= MAX_TITLE_LENGTH) {
		return first;
	}
	const cut = first.slice(0, MAX_TITLE_LENGTH);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
};

/**
 * adds or edits a link within a dialog.
 *
 * @param props current links, edit index (null to add), and save/remove callbacks
 */
export function LinkForm({
	index,
	links,
	onDone,
	onRemove,
}: {
	index: number | null;
	links: ProfileLink[];
	onDone: (links: ProfileLink[]) => void;
	onRemove: () => void;
}) {
	const link = index === null ? null : links[index]!;
	const existingUrls = new Set(
		links.filter((_, i) => i !== index).map((other) => normalizeProfileLinkUrl(other.url)),
	);

	const startingInput = link ? formatLinkUrl(link.url) : '';
	const [input, setInput] = useState(startingInput);
	const [title, setTitle] = useState(link?.title ?? '');
	// sites may block previews, so a failed check must allow saving anyway.
	const [reachability, setReachability] = useState<'checking' | 'reachable' | 'unchecked' | 'unreachable'>(
		'unchecked',
	);
	// validate on save to avoid errors for partially typed URLs.
	const [error, setError] = useState<'duplicate' | 'invalid'>();

	const validation = validateLinkInput(input);
	const provider = validation.provider;
	const touched = input.trim() !== startingInput;
	// preserve the original URL when only the title changes.
	const targetUrl = link && !touched ? link.url : validation.url;
	const canSuggest = targetUrl !== null && targetUrl !== link?.url && !provider;
	const settledUrl = useDebouncedValue(targetUrl, SUGGEST_DELAY);

	// don't overwrite user-entered titles with suggestions.
	const autoTitle = useRef('');
	useEffect(() => {
		if (!canSuggest || settledUrl !== targetUrl) {
			return;
		}
		let cancelled = false;
		void fetchLinkPage(targetUrl).then((page) => {
			if (cancelled || !page) {
				return;
			}
			setReachability('reachable');
			const suggestion = suggestTitle(page.title);
			if (!suggestion) {
				return;
			}
			const previousAuto = autoTitle.current;
			autoTitle.current = suggestion;
			setTitle((prev) => {
				return prev.trim() && prev !== previousAuto ? prev : suggestion;
			});
		});
		return () => {
			cancelled = true;
		};
	}, [canSuggest, settledUrl, targetUrl]);

	const nextTitle = cleanTitle(title);
	const isUnchanged = !!link && targetUrl === link.url && nextTitle === link.title;
	const canSave = !validation.isEmpty && !isUnchanged && reachability !== 'checking';

	const save = async () => {
		if (!canSave) {
			return;
		}
		if (!targetUrl) {
			setError('invalid');
			return;
		}
		if (existingUrls.has(normalizeProfileLinkUrl(targetUrl))) {
			setError('duplicate');
			return;
		}

		const isNewDestination = targetUrl !== link?.url;
		const needsCheck = isNewDestination && reachability === 'unchecked';
		// refresh favicons on every save; support links use bundled logos.
		const needsIcon = !provider;
		let icon = isNewDestination || provider ? undefined : link?.icon;
		if (needsCheck || needsIcon) {
			setReachability('checking');
			const [page, fetchedIcon] = await Promise.all([
				needsCheck ? fetchLinkPage(targetUrl) : undefined,
				needsIcon ? fetchLinkIcon(targetUrl) : undefined,
			]);
			if (page === null) {
				setReachability('unreachable');
				return;
			}
			setReachability('reachable');
			if (fetchedIcon) {
				icon = { kind: 'fetched', image: fetchedIcon };
			}
		}

		const saved: ProfileLink = {
			url: targetUrl,
			title: nextTitle,
			icon,
			record: link?.record,
		};
		onDone(index === null ? [...links, saved] : links.map((other, i) => (i === index ? saved : other)));
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			void save();
		}
	};

	let errorText: string | undefined;
	switch (error) {
		case 'duplicate': {
			errorText = m['features.profileLinks.form.error.duplicate']();
			break;
		}
		case 'invalid': {
			errorText = m['features.profileLinks.form.error.invalid']();
			break;
		}
		case undefined: {
			errorText =
				reachability === 'unreachable' ? m['features.profileLinks.form.error.unreachable']() : undefined;
			break;
		}
	}

	let titlePlaceholder: string;
	if (provider) {
		titlePlaceholder = m['features.profileLinks.supportOn']({ provider: provider.name });
	} else if (targetUrl) {
		titlePlaceholder = getLinkHost(targetUrl);
	} else {
		titlePlaceholder = m['features.profileLinks.form.titlePlaceholder']();
	}

	let saveLabel: string;
	if (reachability === 'unreachable') {
		saveLabel = m['features.profileLinks.form.saveAnyway']();
	} else if (link) {
		saveLabel = m['common.action.save']();
	} else {
		saveLabel = m['features.profileLinks.form.add']();
	}

	return (
		<>
			<TextField.Root isInvalid={!!errorText}>
				<TextField.LabelText>{m['features.profileLinks.form.linkLabel']()}</TextField.LabelText>
				<TextField.Input
					autoCapitalize="none"
					autoComplete="url"
					autoFocus
					label={m['features.profileLinks.form.linkLabel']()}
					onChangeText={(value) => {
						setInput(value);
						setReachability('unchecked');
						setError(undefined);
					}}
					onKeyDown={onKeyDown}
					placeholder="yoursite.com"
					value={input}
				/>
				{errorText && (
					<Text color="negative_500" size="sm">
						{errorText}
					</Text>
				)}
				{!errorText && touched && provider && (
					<div className={css.providerNote}>
						<ProviderLogo className={css.providerNoteLogo} provider={provider} />
						<Text className={css.providerNoteText} leading="snug" size="sm">
							{m['features.profileLinks.form.recognized']({ provider: provider.name })}
						</Text>
					</div>
				)}
			</TextField.Root>

			<TextField.Root>
				<TextField.LabelText
					accessory={
						title.length >= SHOW_COUNTER_FROM ? (
							<Text color="textContrastLow" size="sm">
								{title.length}/{MAX_TITLE_LENGTH}
							</Text>
						) : undefined
					}
				>
					{m['features.profileLinks.form.titleLabel']()}
				</TextField.LabelText>
				<TextField.Input
					autoCapitalize="words"
					label={m['features.profileLinks.form.titleLabel']()}
					maxLength={MAX_TITLE_LENGTH}
					onChangeText={setTitle}
					onKeyDown={onKeyDown}
					placeholder={titlePlaceholder}
					value={title}
				/>
			</TextField.Root>

			<Dialog.Actions align="between">
				{link ? (
					<Button color="negative_subtle" label={m['common.action.remove']()} onClick={onRemove} size="small">
						<ButtonText>{m['common.action.remove']()}</ButtonText>
					</Button>
				) : (
					<div></div>
				)}

				<Button
					className={provider ? css.supportSave : undefined}
					disabled={!canSave}
					label={saveLabel}
					onClick={() => void save()}
					size="small"
				>
					<ButtonText>{saveLabel}</ButtonText>
					{reachability === 'checking' && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
				</Button>
			</Dialog.Actions>
		</>
	);
}
