'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type InputHTMLAttributes, useCallback } from 'react';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import * as styles from './password-input.css';
import { useRootContext } from './shared';

export type InputProps = Omit<RenderProps<'input'>, 'disabled' | 'id' | 'type'> & {
	/** requests a password-manager opt-out for non-password secrets, e.g. API keys. */
	ignorePasswordManagers?: boolean;
};

const PASSWORD_MANAGER_OPT_OUT = {
	// 1Password
	'data-1p-ignore': '',
	// Bitwarden
	'data-bwignore': 'true',
	// Dashlane
	'data-form-type': 'other',
	// LastPass
	'data-lpignore': 'true',
	// Proton Pass
	'data-protonpass-ignore': 'true',
} as const;

/**
 * a password input that masks its value on form submission or reset. `render` must produce an `<input>`.
 *
 * @param props element props
 * @returns the input element
 * @throws if rendered outside `Root`
 */
export const Input = ({ render, ref, ignorePasswordManagers = false, ...elementProps }: InputProps) => {
	const { visible, disabled, inputId, inputRef, setVisible } = useRootContext();

	// remask on submit so browsers treat the value as a password.
	const trackForm = useCallback(
		(input: HTMLInputElement | null) => {
			const form = input?.form;
			if (!form) {
				return;
			}

			const controller = new AbortController();
			form.addEventListener(
				'reset',
				(event) => {
					if (!event.defaultPrevented) {
						setVisible(false, 'form-reset', event);
					}
				},
				{ signal: controller.signal },
			);
			form.addEventListener('submit', (event) => setVisible(false, 'form-submit', event), {
				signal: controller.signal,
			});
			return () => controller.abort();
		},
		[setVisible],
	);

	const internalProps: InputHTMLAttributes<HTMLInputElement> = {
		className: styles.input,
		id: inputId,
		type: visible ? 'text' : 'password',
		disabled,
		// avoid sending revealed secrets to spellcheck or autocorrect services.
		autoCapitalize: 'off',
		autoCorrect: 'off',
		spellCheck: false,
		...(ignorePasswordManagers ? PASSWORD_MANAGER_OPT_OUT : undefined),
	};

	return useRender({
		tag: 'input',
		render,
		refs: [ref, inputRef, trackForm],
		props: mergeProps<'input'>(dataAttributes({ visible, disabled }), internalProps, elementProps),
	});
};
