import type { AnyProfileView, AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { isDid, parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useParams, useRoute } from '@oomfware/stacker';

import { STARTER_PACK_MAX_SIZE } from '#/lib/constants';
import { useTitle } from '#/lib/hooks/useTitle';
import { prefetchImage } from '#/lib/media/prefetch';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { enforceLen } from '#/lib/strings/helpers';
import { getStarterPackOgCard, parseStarterPackUri } from '#/lib/strings/starter-pack';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useAllListMembersQuery } from '#/state/queries/list-members';
import { useProfileQuery } from '#/state/queries/profile';
import {
	useCreateStarterPackMutation,
	useEditStarterPackMutation,
	useStarterPackQuery,
} from '#/state/queries/starter-packs';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { useWizardState, type WizardStep } from '#/screens/StarterPack/Wizard/State';
import { StepDetails } from '#/screens/StarterPack/Wizard/StepDetails';
import { StepFeeds } from '#/screens/StarterPack/Wizard/StepFeeds';
import { StepProfiles } from '#/screens/StarterPack/Wizard/StepProfiles';

import * as Dialog from '#/components/Dialog';
import { markStarterPackCreated } from '#/components/dialogs/starter-pack-dialog-reopen';
import { ListMaybePlaceholder } from '#/components/Lists';
import { Spinner } from '#/components/Spinner';
import { WizardEditListDialog } from '#/components/StarterPack/Wizard/WizardEditListDialog';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import { Provider } from './State';
import * as css from './Wizard.css';

// registered for both StarterPackEdit (has rkey) and StarterPackWizard (has targetDid).
export function Wizard() {
	const { name: routeName } = useRoute();
	const params = useParams();
	const rkey = typeof params.rkey === 'string' ? params.rkey : undefined;
	const targetDid = isDid(params.targetDid) ? params.targetDid : undefined;
	useTitle(
		routeName === 'StarterPackEdit'
			? m['navigation.starterPack.edit.title']()
			: m['common.starterPack.action.create'](),
	);
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	// Use targetDid if provided (from dialog), otherwise use current account
	const profileDid = targetDid || currentAccount!.did;

	const {
		data: starterPack,
		isLoading: isLoadingStarterPack,
		isError: isErrorStarterPack,
	} = useStarterPackQuery({ did: currentAccount!.did, rkey });
	const listUri = starterPack?.list?.uri;

	const {
		data: listItems,
		isLoading: isLoadingProfiles,
		isError: isErrorProfiles,
	} = useAllListMembersQuery(listUri);

	const {
		data: profile,
		isLoading: isLoadingProfile,
		isError: isErrorProfile,
	} = useProfileQuery({ did: profileDid });

	const isEdit = !!rkey;
	const isReady = (!isEdit || (isEdit && starterPack && listItems)) && profile && moderationOpts;

	if (!isReady) {
		return (
			<Layout.Screen>
				<ListMaybePlaceholder
					isLoading={isLoadingStarterPack || isLoadingProfiles || isLoadingProfile}
					isError={isErrorStarterPack || isErrorProfiles || isErrorProfile}
					errorMessage={m['screens.starterPack.error.notFound']()}
				/>
			</Layout.Screen>
		);
	} else if (isEdit && starterPack?.creator.did !== currentAccount?.did) {
		return (
			<Layout.Screen>
				<ListMaybePlaceholder
					isLoading={false}
					isError={true}
					errorMessage={m['screens.starterPack.error.notFound']()}
				/>
			</Layout.Screen>
		);
	}

	return (
		<Layout.Screen>
			<Provider starterPack={starterPack} listItems={listItems} targetProfile={profile}>
				<WizardInner
					currentStarterPack={starterPack}
					currentListItems={listItems}
					profile={profile}
					moderationOpts={moderationOpts}
					fromDialog={targetDid !== undefined}
				/>
			</Provider>
		</Layout.Screen>
	);
}

function WizardInner({
	currentStarterPack,
	currentListItems,
	profile,
	moderationOpts,
	fromDialog,
}: {
	currentStarterPack?: AppBskyGraphDefs.StarterPackView;
	currentListItems?: AppBskyGraphDefs.ListItemView[];
	profile: AppBskyActorDefs.ProfileViewDetailed;
	moderationOpts: ModerationOptions;
	fromDialog: boolean;
}) {
	const router = useRouter();
	const [state, dispatch] = useWizardState();
	const { currentAccount } = useSession();

	const { data: currentProfile } = useProfileQuery({
		did: currentAccount?.did,
		staleTime: 0,
	});
	const parsed = parseStarterPackUri(currentStarterPack?.uri);

	const getDefaultName = () => {
		const displayName = createSanitizedDisplayName(currentProfile!, true);
		return m['screens.starterPack.name.display']({ name: displayName }).slice(0, 50);
	};

	const wizardUiStrings: Record<WizardStep, { header: string; nextBtn: string; subtitle?: string }> = {
		Details: {
			header: m['common.starterPack.label'](),
			nextBtn: m['common.action.next'](),
		},
		Profiles: {
			header: m['screens.starterPack.people.choose'](),
			nextBtn: m['common.action.next'](),
		},
		Feeds: {
			header: m['screens.starterPack.feeds.choose'](),
			nextBtn:
				state.feeds.length === 0
					? m['screens.starterPack.setup.skip']()
					: m['screens.starterPack.setup.finish'](),
		},
	};
	const currUiStrings = wizardUiStrings[state.currentStep];

	const onSuccessCreate = (data: { uri: string; cid: string }) => {
		const rkey = parseCanonicalResourceUri(data.uri).rkey;
		void prefetchImage(getStarterPackOgCard(currentProfile!.did, rkey));
		dispatch({ type: 'SetProcessing', processing: false });

		// hand control back to the dialog that launched us — it reopens itself once its screen is in view
		// again. a wizard deep-linked with a `targetDid` has no such screen behind it, so it falls through
		// to the pack that was just created, same as any other wizard.
		if (fromDialog && router.canGoBack) {
			markStarterPackCreated();
			router.back();
			return;
		}

		router.replace(router.build('StarterPack', { actor: currentProfile!.did, new: true, rkey }));
	};

	const onSuccessEdit = () => {
		if (router.canGoBack) {
			router.back();
		} else {
			router.replace(router.build('StarterPack', { actor: currentAccount!.did, rkey: parsed!.rkey }));
		}
	};

	const { mutate: createStarterPack } = useCreateStarterPackMutation({
		onSuccess: onSuccessCreate,
		onError: (e) => {
			logger.error('Failed to create starter pack', { safeMessage: e });
			dispatch({ type: 'SetProcessing', processing: false });
			Toast.show(m['screens.starterPack.error.create'](), {
				type: 'error',
			});
		},
	});
	const { mutate: editStarterPack } = useEditStarterPackMutation({
		onSuccess: onSuccessEdit,
		onError: (e) => {
			logger.error('Failed to edit starter pack', { safeMessage: e });
			dispatch({ type: 'SetProcessing', processing: false });
			Toast.show(m['screens.starterPack.error.create'](), {
				type: 'error',
			});
		},
	});

	const submit = () => {
		dispatch({ type: 'SetProcessing', processing: true });
		if (currentStarterPack && currentListItems) {
			editStarterPack({
				name: state.name?.trim() || getDefaultName(),
				description: state.description?.trim(),
				profiles: state.profiles,
				feeds: state.feeds,
				currentStarterPack: currentStarterPack,
				currentListItems: currentListItems,
			});
		} else {
			createStarterPack({
				name: state.name?.trim() || getDefaultName(),
				description: state.description?.trim(),
				profiles: state.profiles,
				feeds: state.feeds,
			});
		}
	};

	const onNext = () => {
		if (state.currentStep === 'Feeds') {
			submit();
			return;
		}
		dispatch({ type: 'Next' });
	};

	const items = state.currentStep === 'Profiles' ? state.profiles : state.feeds;

	const isEditEnabled =
		(state.currentStep === 'Profiles' && items.length > 1) ||
		(state.currentStep === 'Feeds' && items.length > 0);

	const editDialogHandle = Dialog.useDialogHandle();

	return (
		<>
			<Layout.Header.Outer>
				<Layout.Header.BackButton
					label={m['common.action.back']()}
					onClick={(evt) => {
						if (state.currentStep !== 'Details') {
							evt.preventDefault();
							dispatch({ type: 'Back' });
						}
					}}
				/>
				<Layout.Header.Content>
					<Layout.Header.TitleText>{currUiStrings.header}</Layout.Header.TitleText>
				</Layout.Header.Content>
				{isEditEnabled && (
					<Layout.Header.Slot>
						<Button
							label={m['common.action.edit']()}
							color="secondary"
							size="small"
							onClick={() => editDialogHandle.open(null)}
						>
							<ButtonText>{m['common.action.edit']()}</ButtonText>
						</Button>
					</Layout.Header.Slot>
				)}
			</Layout.Header.Outer>
			{state.currentStep === 'Details' ? (
				<div className={css.details}>
					<StepDetails />
					<Button
						label={m['common.action.next']()}
						color="primary"
						size="large"
						className={css.detailsNext}
						onClick={() => dispatch({ type: 'Next' })}
					>
						<ButtonText>{m['common.action.next']()}</ButtonText>
					</Button>
				</div>
			) : state.currentStep === 'Profiles' ? (
				<StepProfiles moderationOpts={moderationOpts} />
			) : (
				<StepFeeds moderationOpts={moderationOpts} />
			)}
			{state.currentStep !== 'Details' && <Footer onNext={onNext} nextBtnText={currUiStrings.nextBtn} />}
			<WizardEditListDialog
				handle={editDialogHandle}
				state={state}
				dispatch={dispatch}
				moderationOpts={moderationOpts}
				profile={profile}
			/>
		</>
	);
}

function Footer({ onNext, nextBtnText }: { onNext: () => void; nextBtnText: string }) {
	const [state] = useWizardState();
	const { currentAccount } = useSession();
	const items = state.currentStep === 'Profiles' ? state.profiles : state.feeds;

	const minimumItems = state.currentStep === 'Profiles' ? 8 : 0;

	return (
		<div className={css.footer}>
			{items.length > minimumItems && (
				<Text weight="semiBold" className={css.countBadge}>
					{items.length}/{state.currentStep === 'Profiles' ? STARTER_PACK_MAX_SIZE : 3}
				</Text>
			)}
			<div className={css.avatarRow}>
				{items.slice(0, 6).map((p, index) => (
					<div
						key={'uri' in p ? p.uri : p.did}
						className={css.avatarRing}
						style={
							state.currentStep === 'Profiles'
								? { zIndex: 1 - index, marginLeft: index > 0 ? -8 : 0 }
								: { marginRight: 4 }
						}
					>
						<UserAvatar
							avatar={p.avatar}
							size={32}
							type={state.currentStep === 'Profiles' ? 'user' : 'algo'}
						/>
					</div>
				))}
			</div>
			{
				state.currentStep === 'Profiles' ? (
					<Text size="md" className={css.helperText}>
						{
							items.length < 2 ? (
								currentAccount?.did === items[0]!.did ? (
									m['screens.starterPack.people.justYou']()
								) : (
									<Trans
										message={m['screens.starterPack.people.justName']}
										inputs={{ name: getName(items[0]!) }}
										markup={{
											t0: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
										}}
									/>
								)
							) : items.length === 2 ? (
								currentAccount?.did === items[0]!.did ? (
									<Trans
										message={m['screens.starterPack.included.youAndOne']}
										inputs={{ name: getName(items[1]! /* [0] is self, skip it */) }}
										markup={{
											t0: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
											t1: ({ children }) => <Text>{children}</Text>,
											t2: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
										}}
									/>
								) : (
									<Trans
										message={m['screens.starterPack.included.twoProfiles']}
										inputs={{
											first: getName(items[0]!),
											second: getName(items[1]! /* [0] is self, skip it */),
										}}
										markup={{
											t0: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
											t1: ({ children }) => <Text>{children}</Text>,
											t2: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
										}}
									/>
								)
							) : items.length > 2 ? (
								<Trans
									message={m['screens.starterPack.included.manyProfiles']}
									inputs={{
										count: items.length - 2,
										first: getName(items[1]! /* [0] is self, skip it */),
										second: getName(items[2]!),
									}}
									markup={{
										t0: ({ children }) => (
											<Text size="md" weight="semiBold">
												{children}
											</Text>
										),
										t1: ({ children }) => (
											<Text size="md" weight="semiBold">
												{children}
											</Text>
										),
									}}
								/>
							) : null /* Should not happen. */
						}
					</Text>
				) : state.currentStep === 'Feeds' ? (
					items.length === 0 ? (
						<div className={css.feedsEmptyHelper}>
							<Text weight="semiBold" size="md" className={css.helperText}>
								{m['screens.starterPack.feeds.addHint']()}
							</Text>
							<Text size="md" className={css.helperText}>
								{m['screens.starterPack.feeds.searchHint']()}
							</Text>
						</div>
					) : (
						<Text size="md" className={css.helperText}>
							{
								items.length === 1 ? (
									<Trans
										message={m['screens.starterPack.included.oneProfile']}
										inputs={{ name: getName(items[0]!) }}
										markup={{
											t0: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
										}}
									/>
								) : items.length === 2 ? (
									<Trans
										message={m['screens.starterPack.included.twoProfiles']}
										inputs={{
											first: getName(items[0]!),
											second: getName(items[1]!),
										}}
										markup={{
											t0: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
											t1: ({ children }) => <Text>{children}</Text>,
											t2: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
										}}
									/>
								) : items.length > 2 ? (
									<Trans
										message={m['screens.starterPack.included.manyFeeds']}
										inputs={{
											count: items.length - 2,
											first: getName(items[0]!),
											second: getName(items[1]!),
										}}
										markup={{
											t0: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
											t1: ({ children }) => (
												<Text size="md" weight="semiBold">
													{children}
												</Text>
											),
										}}
									/>
								) : null /* Should not happen. */
							}
						</Text>
					)
				) : null /* Should not happen. */
			}
			<div className={css.cta}>
				{state.currentStep === 'Profiles' && items.length < 8 && (
					<Text weight="semiBold" size="md" color="textContrastMedium">
						{m['screens.starterPack.people.addMore']({ count: 8 - items.length })}
					</Text>
				)}
				<Button
					label={nextBtnText}
					className={css.ctaButton}
					color="primary"
					size="large"
					onClick={onNext}
					disabled={
						!state.canNext || state.processing || (state.currentStep === 'Profiles' && items.length < 8)
					}
				>
					<ButtonText>{nextBtnText}</ButtonText>
					{state.processing && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
				</Button>
			</div>
		</div>
	);
}

function getName(item: AnyProfileView | AppBskyFeedDefs.GeneratorView) {
	if (typeof item.displayName === 'string') {
		return enforceLen(sanitizeDisplayName(item.displayName), 28, true);
	} else if ('handle' in item && typeof item.handle === 'string') {
		return enforceLen(item.handle, 28, true);
	}
	return '';
}
