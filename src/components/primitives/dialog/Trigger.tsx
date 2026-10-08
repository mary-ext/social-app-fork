'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, useId, useRef } from 'react';

import { type InteractionType, toInteractionType } from '#/lib/browser/input-modality';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { getTriggerAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { type Handle, useTriggerRoot } from './shared';

export type TriggerProps<Payload = void> = Omit<RenderProps<'button'>, 'ref'> & {
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

	const triggerProps: HTMLAttributes<HTMLElement> = {};
	if (attached) {
		triggerProps['aria-haspopup'] = 'dialog';
		triggerProps['aria-expanded'] = open;
		triggerProps['aria-controls'] = controls ?? undefined;

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
		tag: 'button',
		render,
		refs: [ref],
		props: mergeProps<'button'>(
			getTriggerAttributes(open),
			dataAttributes({ disabled }),
			// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
			triggerProps,
			elementProps,
		),
	});
};
