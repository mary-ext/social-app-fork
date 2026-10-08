import { useEffect, useMemo } from 'react';

import { tokenize } from '@atcute/bluesky-search-parser';

import { highlightText } from '#/lib/browser/text-highlights';

import { focusSearch } from '#/state/events';

import * as Dialog from '#/components/Dialog';
import * as SearchField from '#/components/forms/SearchField';
import * as Layout from '#/components/web/Layout';

import { useFocusEffect } from '#/router';

import * as styles from './DialogSearchAutocomplete.css';
import {
	getSyntaxHighlights,
	SearchAutocompleteInput,
	type SearchAutocompleteFieldProps,
} from './SearchAutocompleteInput';

/**
 * fullscreen search dialog with a search-field trigger.
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
 * @returns the trigger button and search dialog
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

	useEffect(() => {
		if (autoFocus) {
			handle.open();
		}
	}, [autoFocus, handle]);

	// subscribe only on the active screen; the open dialog handles its own focus events.
	useFocusEffect(() => {
		return focusSearch.subscribe(() => {
			if (!handle.isOpen) {
				handle.open();
			}
		});
	});

	const syntaxHighlights = useMemo(() => getSyntaxHighlights(tokenize(initialQuery)), [initialQuery]);

	// close before navigation to avoid covering the destination screen.
	const closeThen =
		<T,>(fn: (arg: T) => void) =>
		(arg: T) => {
			handle.close();
			fn(arg);
		};

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<SearchField.Trigger
						placeholder={placeholder}
						shape={shape}
						size={size}
						value={initialQuery}
						valueRef={(el) => (el ? highlightText(el, syntaxHighlights) : undefined)}
					/>
				}
			/>

			<Dialog.Root handle={handle}>
				<Dialog.Popup
					// the search input handles autofocus.
					initialFocus={false}
					label={placeholder}
					scroll="body"
				>
					<SearchAutocompleteInput
						{...props}
						autoFocus
						initialQuery={initialQuery}
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
