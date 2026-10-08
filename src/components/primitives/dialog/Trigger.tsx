'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, useId, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type InteractionType, toInteractionType } from '#/lib/browser/input-modality';

import { triggerStateAttributes } from '../presence';
import { type Handle, useTriggerRoot } from './shared';

export type TriggerState = {
	/** whether the dialog is open and was opened by this trigger. */
	open: boolean;
	disabled: boolean;
};

export type TriggerProps<Payload = void> = Omit<useRender.ComponentProps<'button', TriggerState>, 'ref'> & {
	ref?: Ref<HTMLElement>;
	/** handle shared with a detached `Root`. */
	handle?: Handle<Payload>;
	/** value exposed to the root's render function when this trigger opens the dialog. */
	payload?: Payload;
	/** prevents opening from this trigger. to disable the DOM element, pass `disabled` through `render`. */
	disabled?: boolean;
};

/**
 * opens the dialog on press.
 *
 * @param props behavior and element props
 * @returns the trigger element; a `<button>` by default
 */
export const Trigger = <Payload = void,>({
	render,
	ref,
	handle,
	payload,
	disabled = false,
	...elementProps
}: TriggerProps<Payload>) => {
	const id = useId();
	const pointerTypeRef = useRef<InteractionType>('');
	const { attached, controls, getRoot } = useTriggerRoot(handle, id);

	const open = controls !== null;

	let triggerProps: HTMLAttributes<HTMLElement> = {};
	if (attached) {
		triggerProps = {
			'aria-haspopup': 'dialog',
			'aria-expanded': open,
			'aria-controls': controls ?? undefined,
		};

		if (!disabled) {
			triggerProps.onPointerDown = (event) => {
				pointerTypeRef.current = toInteractionType(event.pointerType);
			};
			triggerProps.onClick = (event) => {
				const method = event.detail === 0 ? 'keyboard' : pointerTypeRef.current || 'mouse';
				getRoot()?.setOpen(true, {
					reason: 'trigger-press',
					event: event.nativeEvent,
					trigger: { element: event.currentTarget, id },
					payload,
					method,
				});
			};
		}
	}

	return useRender({
		render,
		defaultTagName: 'button',
		ref,
		state: { open, disabled },
		stateAttributesMapping: triggerStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'button'>(triggerProps, elementProps),
	});
};
