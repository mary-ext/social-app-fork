import type { AnyProfileView, AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import type { WizardAction, WizardState } from '#/screens/StarterPack/Wizard/State';

import { WizardFeedCard, WizardProfileCard } from '#/components/StarterPack/Wizard/WizardListCard';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import * as css from './WizardEditListDialog.css';

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

	const renderItem = (item: ListItem) =>
		'handle' in item ? (
			<WizardProfileCard
				profile={item}
				btnType="remove"
				state={state}
				dispatch={dispatch}
				moderationOpts={moderationOpts}
			/>
		) : (
			<WizardFeedCard
				generator={item}
				btnType="remove"
				state={state}
				dispatch={dispatch}
				moderationOpts={moderationOpts}
			/>
		);

	const title =
		state.currentStep === 'Profiles'
			? m['components.starterPack.action.editPeople']()
			: m['components.starterPack.action.editFeeds']();

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup scroll="body" label={title}>
				<Dialog.Header.Outer>
					<Dialog.Header.Slot />
					<Dialog.Header.Content>
						<Dialog.Header.TitleText>{title}</Dialog.Header.TitleText>
					</Dialog.Header.Content>
					<Dialog.Header.Slot>
						<Button
							label={m['common.action.close']()}
							variant="ghost"
							color="primary"
							size="small"
							onClick={() => handle.close()}
						>
							<ButtonText>{m['common.action.close']()}</ButtonText>
						</Button>
					</Dialog.Header.Slot>
				</Dialog.Header.Outer>
				<Dialog.List data={data} keyExtractor={keyExtractor} renderItem={renderItem} className={css.list} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}
