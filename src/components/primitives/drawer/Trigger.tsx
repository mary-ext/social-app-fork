'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, useLayoutEffect, useRef, useState } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type InteractionType, toInteractionType } from '#/lib/browser/input-modality';

import { triggerStateAttributes } from '../presence';
import { type Handle, useTriggerRootContext } from './shared';

export type TriggerState = {
	/** whether the drawer is open and was opened by this trigger. */
	open: boolean;
	disabled: boolean;
};

export type TriggerProps = Omit<useRender.ComponentProps<'button', TriggerState>, 'ref'> & {
	ref?: Ref<HTMLElement>;
	/** handle shared with a detached `Root`. */
	handle?: Handle;
	/** prevents opening from this trigger. to disable the DOM element, pass `disabled` through `render`. */
	disabled?: boolean;
};

/**
 * opens the drawer on press.
 *
 * @param props behavior and element props
 * @returns the trigger element; a `<button>` by default
 */
export const Trigger = ({ render, ref, handle, disabled = false, ...elementProps }: TriggerProps) => {
	const ctx = useTriggerRootContext(handle);
	const [element, setElement] = useState<HTMLElement | null>(null);
	const pointerTypeRef = useRef<InteractionType>('');

	const open = !!ctx?.open && element !== null && element === ctx.activeTrigger;

	const claimTrigger = ctx?.claimTrigger;
	useLayoutEffect(() => {
		if (!claimTrigger || !element) {
			return;
		}
		return claimTrigger(element);
	}, [claimTrigger, element]);

	let triggerProps: HTMLAttributes<HTMLElement> = {};
	if (ctx) {
		triggerProps = {
			'aria-haspopup': 'dialog',
			'aria-expanded': open,
			'aria-controls': open ? ctx.popupId : undefined,
		};

		if (!disabled) {
			const { setOpen } = ctx;
			triggerProps.onPointerDown = (event) => {
				pointerTypeRef.current = toInteractionType(event.pointerType);
			};
			triggerProps.onClick = (event) => {
				const method = event.detail === 0 ? 'keyboard' : pointerTypeRef.current || 'mouse';
				setOpen(true, {
					reason: 'trigger-press',
					event: event.nativeEvent,
					trigger: event.currentTarget,
					method,
				});
			};
		}
	}

	return useRender({
		render,
		defaultTagName: 'button',
		ref: [ref ?? null, setElement],
		state: { open, disabled },
		stateAttributesMapping: triggerStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'button'>(triggerProps, elementProps),
	});
};
