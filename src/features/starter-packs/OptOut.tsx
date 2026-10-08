import type { ResourceUri } from '@atcute/lexicons';

import type { ReferenceListOptOutVariables } from '#/state/queries/list';

import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import PeopleAddIcon from '#/icons/central/PeopleAdd_round_outlined_radius1_stroke2.svg';
import PeopleRemoveIcon from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/**
 * menu item for opting out of a starter pack or undoing an opt-out.
 *
 * @param disabled whether the action is unavailable.
 * @param onClick opens the prompt.
 * @param optedOut whether the viewer is opted out.
 */
export function OptOutMenuItem({
	disabled,
	onClick,
	optedOut,
}: {
	disabled: boolean;
	onClick: () => void;
	optedOut: boolean;
}) {
	const label = optedOut
		? m['components.starterPack.optOut.undo.action']()
		: m['components.starterPack.optOut.action']();

	return (
		<Menu.Item label={label} disabled={disabled} onClick={onClick}>
			<Menu.ItemText>{label}</Menu.ItemText>
			<Menu.ItemIcon position="right" icon={optedOut ? PeopleAddIcon : PeopleRemoveIcon} />
		</Menu.Item>
	);
}

/**
 * confirms a starter pack opt-out change and shows a success or error toast.
 *
 * @param handle the prompt handle.
 * @param onToggle an opt-out mutation's `mutate`.
 * @param optOut the viewer's current opt-out, if any.
 */
export function OptOutPrompt({
	handle,
	onToggle,
	optOut,
}: {
	handle: Prompt.PromptHandle;
	onToggle: (
		variables: ReferenceListOptOutVariables,
		options: { onError: (error: Error) => void; onSuccess: () => void },
	) => void;
	optOut: ResourceUri | undefined;
}) {
	let title: string;
	let description: string;
	let cta: string;
	let successToast: string;
	if (optOut) {
		title = m['components.starterPack.optOut.undo.title']();
		description = m['components.starterPack.optOut.undo.message']();
		cta = m['components.starterPack.optOut.undo.action']();
		successToast = m['components.starterPack.optOut.undoneToast']();
	} else {
		title = m['components.starterPack.optOut.title']();
		description = m['components.starterPack.optOut.message']();
		cta = m['components.starterPack.optOut.confirm']();
		successToast = m['components.starterPack.optOut.optedOutToast']();
	}

	const onConfirm = () => {
		onToggle(
			{ current: optOut },
			{
				onError: (error) => {
					console.error('Failed to update starter pack opt-out', error);
					Toast.show(m['components.starterPack.optOut.error'](), { type: 'error' });
				},
				onSuccess: () => {
					Toast.show(successToast);
				},
			},
		);
	};

	return (
		<Prompt.Basic
			handle={handle}
			title={title}
			description={description}
			confirmButtonCta={cta}
			confirmButtonColor={optOut ? 'primary' : 'negative'}
			onConfirm={onConfirm}
		/>
	);
}
