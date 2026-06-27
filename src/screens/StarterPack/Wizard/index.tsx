import { useEffect } from 'react';
import type { AnyProfileView, AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Plural, Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { STARTER_PACK_MAX_SIZE } from '#/lib/constants';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
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

import { useWizardState, type WizardStep } from '#/screens/StarterPack/Wizard/State';
import { StepDetails } from '#/screens/StarterPack/Wizard/StepDetails';
import { StepFeeds } from '#/screens/StarterPack/Wizard/StepFeeds';
import { StepProfiles } from '#/screens/StarterPack/Wizard/StepProfiles';

import { ListMaybePlaceholder } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import { WizardEditListDialog } from '#/components/StarterPack/Wizard/WizardEditListDialog';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { Image } from '#/shims/image';

import { Provider } from './State';
import * as css from './Wizard.css';

export function Wizard({
	route,
}: NativeStackScreenProps<CommonNavigatorParams, 'StarterPackEdit' | 'StarterPackWizard'>) {
	const params = route.params ?? {};
	const rkey = 'rkey' in params ? params.rkey : undefined;
	const fromDialog = 'fromDialog' in params ? params.fromDialog : false;
	const targetDid = 'targetDid' in params ? params.targetDid : undefined;
	const onSuccess = 'onSuccess' in params ? params.onSuccess : undefined;
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

	const isEdit = Boolean(rkey);
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
					fromDialog={fromDialog}
					onSuccess={onSuccess}
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
	onSuccess,
}: {
	currentStarterPack?: AppBskyGraphDefs.StarterPackView;
	currentListItems?: AppBskyGraphDefs.ListItemView[];
	profile: AppBskyActorDefs.ProfileViewDetailed;
	moderationOpts: ModerationOptions;
	fromDialog?: boolean;
	onSuccess?: () => void;
}) {
	const navigation = useNavigation<NavigationProp>();
	const [state, dispatch] = useWizardState();
	const { currentAccount } = useSession();

	const { data: currentProfile } = useProfileQuery({
		did: currentAccount?.did,
		staleTime: 0,
	});
	const parsed = parseStarterPackUri(currentStarterPack?.uri);

	useEffect(() => {
		navigation.setOptions({
			gestureEnabled: false,
		});
	}, [navigation]);

	const getDefaultName = () => {
		const displayName = createSanitizedDisplayName(currentProfile!, true);
		return m['screens.starterPack.title.named']({ displayName }).slice(0, 50);
	};

	const wizardUiStrings: Record<WizardStep, { header: string; nextBtn: string; subtitle?: string }> = {
		Details: {
			header: m['common.label.starterPack'](),
			nextBtn: m['common.action.next'](),
		},
		Profiles: {
			header: m['screens.starterPack.label.choosePeople'](),
			nextBtn: m['common.action.next'](),
		},
		Feeds: {
			header: m['screens.starterPack.label.chooseFeeds'](),
			nextBtn:
				state.feeds.length === 0
					? m['screens.starterPack.action.skip']()
					: m['screens.starterPack.action.finish'](),
		},
	};
	const currUiStrings = wizardUiStrings[state.currentStep];

	const onSuccessCreate = (data: { uri: string; cid: string }) => {
		const rkey = parseCanonicalResourceUri(data.uri).rkey;
		void Image.prefetch([getStarterPackOgCard(currentProfile!.did, rkey)]);
		dispatch({ type: 'SetProcessing', processing: false });

		if (fromDialog) {
			navigation.goBack();
			onSuccess?.();
		} else {
			navigation.replace('StarterPack', {
				name: profile.did,
				rkey,
				new: true,
			});
		}
	};

	const onSuccessEdit = () => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.replace('StarterPack', {
				name: currentAccount!.did,
				rkey: parsed!.rkey,
			});
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
				{isEditEnabled ? (
					<Button
						label={m['common.action.edit']()}
						color="secondary"
						size="small"
						onClick={() => editDialogHandle.open(null)}
					>
						<ButtonText>{m['common.action.edit']()}</ButtonText>
					</Button>
				) : (
					<Layout.Header.Slot />
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
						key={index}
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
									m['screens.starterPack.empty.justYouHint']()
								) : (
									<Trans>
										It's just{' '}
										<Text size="md" weight="semiBold">
											{getName(items[0]!)}{' '}
										</Text>
										right now! Add more people to your starter pack by searching above.
									</Trans>
								)
							) : items.length === 2 ? (
								currentAccount?.did === items[0]!.did ? (
									<Trans>
										<Text size="md" weight="semiBold">
											You
										</Text>{' '}
										and
										<Text> </Text>
										<Text size="md" weight="semiBold">
											{getName(items[1]! /* [0] is self, skip it */)}{' '}
										</Text>
										are included in your starter pack
									</Trans>
								) : (
									<Trans>
										<Text size="md" weight="semiBold">
											{getName(items[0]!)}
										</Text>{' '}
										and
										<Text> </Text>
										<Text size="md" weight="semiBold">
											{getName(items[1]! /* [0] is self, skip it */)}{' '}
										</Text>
										are included in your starter pack
									</Trans>
								)
							) : items.length > 2 ? (
								<Trans context="profiles">
									<Text size="md" weight="semiBold">
										{getName(items[1]! /* [0] is self, skip it */)},{' '}
									</Text>
									<Text size="md" weight="semiBold">
										{getName(items[2]!)},{' '}
									</Text>
									and <Plural value={items.length - 2} one="# other" other="# others" /> are included in your
									starter pack
								</Trans>
							) : null /* Should not happen. */
						}
					</Text>
				) : state.currentStep === 'Feeds' ? (
					items.length === 0 ? (
						<div className={css.feedsEmptyHelper}>
							<Text weight="semiBold" size="md" className={css.helperText}>
								{m['screens.starterPack.empty.addFeedsHint']()}
							</Text>
							<Text size="md" className={css.helperText}>
								{m['screens.starterPack.hint.searchFeeds']()}
							</Text>
						</div>
					) : (
						<Text size="md" className={css.helperText}>
							{
								items.length === 1 ? (
									<Trans>
										<Text size="md" weight="semiBold">
											{getName(items[0]!)}
										</Text>{' '}
										is included in your starter pack
									</Trans>
								) : items.length === 2 ? (
									<Trans>
										<Text size="md" weight="semiBold">
											{getName(items[0]!)}
										</Text>{' '}
										and
										<Text> </Text>
										<Text size="md" weight="semiBold">
											{getName(items[1]!)}{' '}
										</Text>
										are included in your starter pack
									</Trans>
								) : items.length > 2 ? (
									<Trans context="feeds">
										<Text size="md" weight="semiBold">
											{getName(items[0]!)},{' '}
										</Text>
										<Text size="md" weight="semiBold">
											{getName(items[1]!)},{' '}
										</Text>
										and <Plural value={items.length - 2} one="# other" other="# others" /> are included in
										your starter pack
									</Trans>
								) : null /* Should not happen. */
							}
						</Text>
					)
				) : null /* Should not happen. */
			}
			<div className={css.cta}>
				{state.currentStep === 'Profiles' && items.length < 8 && (
					<Text weight="semiBold" size="md" color="textContrastMedium">
						{m['screens.starterPack.addMore']({ count: 8 - items.length })}
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
					{state.processing && <ButtonIcon icon={Loader} />}
				</Button>
			</div>
		</div>
	);
}

function getName(item: AnyProfileView | AppBskyFeedDefs.GeneratorView) {
	if (typeof item.displayName === 'string') {
		return enforceLen(sanitizeDisplayName(item.displayName), 28, true);
	} else if ('handle' in item && typeof item.handle === 'string') {
		return enforceLen(sanitizeHandle(item.handle), 28, true);
	}
	return '';
}
