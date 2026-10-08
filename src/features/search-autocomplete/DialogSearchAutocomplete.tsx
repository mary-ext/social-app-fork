import { useEffect, useMemo, useRef, useState } from 'react';

import { tokenize } from '@atcute/bluesky-search-parser';

import { useInputHighlights } from '#/lib/hooks/use-input-highlights';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { focusSearch } from '#/state/events';

import * as Dialog from '#/components/Dialog';
import * as SearchField from '#/components/forms/SearchField';
import * as Layout from '#/components/web/Layout';

import { useFocusEffect } from '#/router';

import * as styles from './DialogSearchAutocomplete.css';
import {
	getSyntaxHighlights,
	type InputSelection,
	SearchAutocompleteInput,
	type SearchAutocompleteFieldProps,
} from './SearchAutocompleteInput';

/**
 * opens a fullscreen search dialog, preserving the tapped caret position.
 *
 * @param autoFocus open the dialog on mount
 * @param fixedFilters operators supplied outside the editable query
 * @param initialQuery initial text for the trigger and dialog fields
 * @param onNavigate navigate to an in-app path
 * @param onNavigateToProfile open the selected profile
 * @param onSubmit run a search
 * @param placeholder text shown when empty
 * @param shape corner shape for both fields
 * @param size size preset for both fields
 * @returns the trigger field and search dialog
 */
export function DialogSearchAutocomplete({
	autoFocus,
	initialQuery = '',
	onNavigate,
	onNavigateToProfile,
	onSubmit,
	placeholder,
	shape,
	size,
	...props
}: SearchAutocompleteFieldProps) {
	const handle = Dialog.useDialogHandle();
	const [selection, setSelection] = useState<InputSelection>({
		start: initialQuery.length,
		end: initialQuery.length,
	});

	const triggerRef = useRef<HTMLInputElement | null>(null);
	// wait for click: pointer focus fires before the caret moves.
	const pointerDownRef = useRef(false);

	// handle.open triggers onOpenChange, which updates the dialog registry.
	const openAt = (next: InputSelection) => {
		setSelection(next);
		handle.open(null);
	};

	const openAtEnd = useNonReactiveCallback(() => {
		openAt({ start: initialQuery.length, end: initialQuery.length });
	});

	useEffect(() => {
		if (autoFocus) {
			openAtEnd();
		}
	}, [autoFocus, openAtEnd]);

	// subscribe only on the active screen; the open dialog handles its own focus events.
	useFocusEffect(() => {
		return focusSearch.subscribe(() => {
			if (!handle.isOpen) {
				openAtEnd();
			}
		});
	});

	const syntaxHighlights = useMemo(() => getSyntaxHighlights(tokenize(initialQuery)), [initialQuery]);

	useInputHighlights(triggerRef, syntaxHighlights);

	// close before navigation to avoid covering the destination screen.
	const closeThen =
		<T,>(fn: (arg: T) => void) =>
		(arg: T) => {
			handle.close();
			fn(arg);
		};

	return (
		<>
			<SearchField.Root shape={shape} size={size}>
				<SearchField.Icon />
				<SearchField.Input
					onBlur={() => {
						pointerDownRef.current = false;
					}}
					// editing happens in the dialog; this field only supplies the initial caret.
					onChange={() => {}}
					onClick={(event) => {
						if (!pointerDownRef.current) {
							return;
						}
						pointerDownRef.current = false;

						const el = event.currentTarget;
						openAt({ start: el.selectionStart ?? el.value.length, end: el.selectionEnd ?? el.value.length });
					}}
					onFocus={() => {
						if (!pointerDownRef.current) {
							openAtEnd();
						}
					}}
					onPointerCancel={() => {
						pointerDownRef.current = false;
					}}
					onPointerDown={() => {
						pointerDownRef.current = true;
					}}
					placeholder={placeholder}
					ref={triggerRef}
					value={initialQuery}
				/>
			</SearchField.Root>

			<Dialog.Root handle={handle}>
				<Dialog.Popup
					// restoring trigger focus would reopen the dialog.
					finalFocus={false}
					// the search field restores its caret before focusing itself.
					initialFocus={false}
					label={placeholder}
					scroll="body"
				>
					<SearchAutocompleteInput
						{...props}
						autoFocus
						initialQuery={initialQuery}
						initialSelection={selection}
						inline
						onNavigate={closeThen(onNavigate)}
						onNavigateToProfile={closeThen(onNavigateToProfile)}
						onSubmit={closeThen(onSubmit)}
						placeholder={placeholder}
						shape={shape}
						size={size}
					>
						{({ field, list }) => (
							<>
								<Layout.Header.Outer sticky={false} noBottomBorder>
									<Layout.Header.BackButton
										onClick={(event) => {
											event.preventDefault();
											handle.close();
										}}
									/>
									<Layout.Header.Content>{field}</Layout.Header.Content>
								</Layout.Header.Outer>

								<Dialog.Body className={styles.body}>{list}</Dialog.Body>
							</>
						)}
					</SearchAutocompleteInput>
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}
