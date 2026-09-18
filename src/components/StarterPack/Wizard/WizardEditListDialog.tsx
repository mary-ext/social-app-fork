import type { AnyProfileView, AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import type { WizardAction, WizardState } from '#/screens/StarterPack/Wizard/State';

import * as Dialog from '#/components/Dialog';
import { WizardFeedCard, WizardProfileCard } from '#/components/StarterPack/Wizard/WizardListCard';

import { m } from '#/paraglide/messages';

import * as css from './WizardEditListDialog.css';

const WIZARD_ITEM_HEIGHT_ESTIMATE = 67;

type ListItem = AnyProfileView | AppBskyFeedDefs.GeneratorView;

function keyExtractor(item: ListItem, index: number) {
	return `${item.did}-${index}`;
}

export function WizardEditListDialog({
	handle,
	state,
	dispatch,
	moderationOpts,
	profile,
}: {
	handle: Dialog.DialogHandle;
	state: WizardState;
	dispatch: (action: WizardAction) => void;
	moderationOpts: ModerationOptions;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const data: ListItem[] =
		state.currentStep === 'Feeds'
			? state.feeds
			: [profile, ...state.profiles.filter((p) => p.did !== profile.did)];

	const renderItem = ({ item: view }: Dialog.ListRenderItemInfo<ListItem>) =>
		'handle' in view ? (
			<WizardProfileCard
				profile={view}
				btnType="remove"
				state={state}
				dispatch={dispatch}
				moderationOpts={moderationOpts}
			/>
		) : (
			<WizardFeedCard
				generator={view}
				btnType="remove"
				state={state}
				dispatch={dispatch}
				moderationOpts={moderationOpts}
			/>
		);

	const title =
		state.currentStep === 'Profiles'
			? m['components.starterPack.edit.people']()
			: m['components.starterPack.edit.feeds']();

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup scroll="body">
				<Dialog.Header.Root>
					<Dialog.Header.Close />
					<Dialog.Header.Title>{title}</Dialog.Header.Title>
				</Dialog.Header.Root>
				<Dialog.List
					data={data}
					estimateHeight={WIZARD_ITEM_HEIGHT_ESTIMATE}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					className={css.list}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
