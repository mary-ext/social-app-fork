import { useEffect, useRef, useState } from 'react';

import { Autocomplete } from '@base-ui/react/autocomplete';

import { useMediaQuery } from '#/lib/browser/media-query';

import { focusSearch } from '#/state/events';

import * as SearchField from '#/components/forms/SearchField';

import { m } from '#/paraglide/messages';

import { DialogSearchAutocomplete } from './DialogSearchAutocomplete';
import * as styles from './SearchAutocomplete.css';
import { SearchAutocompleteInput, type SearchAutocompleteFieldProps } from './SearchAutocompleteInput';

type PopoverSearchAutocompleteProps = SearchAutocompleteFieldProps & {
	eager?: boolean;
};

/**
 * search field with popover suggestions on wide screens and a fullscreen dialog on narrow screens.
 *
 * @param autoFocus whether to focus an eager field (or open the dialog) on mount
 * @param eager mount the wide-screen autocomplete before focus
 * @param fixedFilters operators supplied outside the editable query
 * @param initialQuery initial query; changing it resets the field
 * @param onNavigate navigate to an in-app path
 * @param onNavigateToProfile open the selected profile
 * @param onSubmit run a search
 * @param placeholder text shown when empty
 * @param shape field corner shape
 * @param size field size preset
 * @returns the responsive search field
 */
export function SearchAutocomplete({
	eager,
	placeholder = m['common.action.search'](),
	...props
}: Omit<PopoverSearchAutocompleteProps, 'placeholder'> & { placeholder?: string }) {
	const gtMobile = useMediaQuery('(width >= 800px)');

	if (!gtMobile) {
		return <DialogSearchAutocomplete {...props} placeholder={placeholder} />;
	}

	return <PopoverSearchAutocomplete {...props} eager={eager} placeholder={placeholder} />;
}

function PopoverSearchAutocomplete({
	autoFocus,
	eager,
	initialQuery,
	placeholder,
	shape,
	size,
	...props
}: PopoverSearchAutocompleteProps) {
	const [active, setActive] = useState(eager ?? false);
	const placeholderRef = useRef<HTMLInputElement | null>(null);

	// the active field owns focus after the lazy placeholder is replaced.
	useEffect(() => {
		return focusSearch.subscribe(() => {
			placeholderRef.current?.focus();
		});
	}, []);

	if (active) {
		return (
			<SearchAutocompleteInput
				{...props}
				autoFocus={autoFocus || !eager}
				initialQuery={initialQuery}
				inline={false}
				placeholder={placeholder}
				shape={shape}
				size={size}
			>
				{({ field, fieldRef, list, popupRef }) => (
					<>
						{field}
						<Autocomplete.Portal>
							<Autocomplete.Positioner
								align="end"
								anchor={fieldRef}
								className={styles.positioner}
								sideOffset={6}
							>
								<Autocomplete.Popup className={styles.popup} ref={popupRef}>
									{list}
								</Autocomplete.Popup>
							</Autocomplete.Positioner>
						</Autocomplete.Portal>
					</>
				)}
			</SearchAutocompleteInput>
		);
	}

	return (
		<SearchField.Root shape={shape} size={size}>
			<SearchField.Icon />
			<SearchField.Input onFocus={() => setActive(true)} placeholder={placeholder} ref={placeholderRef} />
		</SearchField.Root>
	);
}
