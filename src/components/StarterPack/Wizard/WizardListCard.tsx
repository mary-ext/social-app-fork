import type { AnyProfileView, AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	type DisplayRestrictions,
	getDisplayRestrictions,
	moderateFeedGenerator,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';

import { DISCOVER_FEED_URI, STARTER_PACK_MAX_SIZE } from '#/lib/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useSession } from '#/state/session';

import type { WizardAction, WizardState } from '#/screens/StarterPack/Wizard/State';

import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonText } from '#/components/web/Button';
import * as Toggle from '#/components/web/forms/Toggle';

import * as css from './WizardListCard.css';

function WizardListCard({
	type,
	btnType,
	displayName,
	subtitle,
	onPress,
	avatar,
	included,
	disabled,
	moderationUi,
}: {
	type: 'user' | 'algo';
	btnType: 'checkbox' | 'remove';
	profile?: AppBskyActorDefs.ProfileViewBasic;
	feed?: AppBskyFeedDefs.GeneratorView;
	displayName: string;
	subtitle: string;
	onPress: () => void;
	avatar?: string;
	included?: boolean;
	disabled?: boolean;
	moderationUi: DisplayRestrictions;
}) {
	const { t: l } = useLingui();

	const rowContent = (
		<>
			<UserAvatar size={40} avatar={avatar} moderation={moderationUi} type={type} />
			<div className={css.textCol}>
				<Text color="textContrastHigh" weight="semiBold" size="md" numberOfLines={1}>
					{displayName}
				</Text>
				<Text color="textContrastMedium" size="md_sub" numberOfLines={1}>
					{subtitle}
				</Text>
			</div>
		</>
	);

	if (btnType === 'checkbox') {
		return (
			<Toggle.Item
				checked={included}
				onChange={onPress}
				disabled={disabled}
				label={included ? l`Remove ${displayName} from starter pack` : l`Add ${displayName} to starter pack`}
				className={css.row}
			>
				{rowContent}
				<Toggle.CheckboxIndicator />
			</Toggle.Item>
		);
	}

	// the remove variant is a static row with an inline button — not a toggle, so it can't be a Toggle.Item
	// (that renders a <button>, and the remove control would be an invalid nested <button>).
	return (
		<div className={css.row}>
			{rowContent}
			{!disabled && (
				<Button label={l`Remove`} variant="solid" color="secondary" size="small" onClick={onPress}>
					<ButtonText>
						<Trans>Remove</Trans>
					</ButtonText>
				</Button>
			)}
		</div>
	);
}

export function WizardProfileCard({
	btnType,
	state,
	dispatch,
	profile,
	moderationOpts,
}: {
	btnType: 'checkbox' | 'remove';
	state: WizardState;
	dispatch: (action: WizardAction) => void;
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
}) {
	const { currentAccount } = useSession();

	// Determine the "main" profile for this starter pack - either targetDid or current account
	const targetProfileDid = state.targetDid || currentAccount?.did;
	const isTarget = profile.did === targetProfileDid;
	const included = isTarget || state.profiles.some((p) => p.did === profile.did);
	const disabled = isTarget || (!included && state.profiles.length >= STARTER_PACK_MAX_SIZE - 1);
	const moderationUi = getDisplayRestrictions(
		moderateProfile(profile, moderationOpts),
		DisplayContext.ProfileMedia,
	);
	const displayName = profile.displayName
		? sanitizeDisplayName(profile.displayName)
		: sanitizeHandle(profile.handle);

	const onPress = () => {
		if (disabled) return;
		if (profile.did === targetProfileDid) return;

		if (!included) {
			dispatch({ type: 'AddProfile', profile });
		} else {
			dispatch({ type: 'RemoveProfile', profileDid: profile.did });
		}
	};

	return (
		<WizardListCard
			type="user"
			btnType={btnType}
			displayName={sanitizeHandle(profile.handle)}
			subtitle={displayName}
			onPress={onPress}
			avatar={profile.avatar}
			included={included}
			disabled={disabled}
			moderationUi={moderationUi}
		/>
	);
}

export function WizardFeedCard({
	btnType,
	generator,
	state,
	dispatch,
	moderationOpts,
}: {
	btnType: 'checkbox' | 'remove';
	generator: AppBskyFeedDefs.GeneratorView;
	state: WizardState;
	dispatch: (action: WizardAction) => void;
	moderationOpts: ModerationOptions;
}) {
	const isDiscover = generator.uri === DISCOVER_FEED_URI;
	const included = isDiscover || state.feeds.some((f) => f.uri === generator.uri);
	const disabled = isDiscover || (!included && state.feeds.length >= 3);
	const moderationUi = getDisplayRestrictions(
		moderateFeedGenerator(generator, moderationOpts),
		DisplayContext.ProfileMedia,
	);

	const onPress = () => {
		if (disabled) return;
		if (included) {
			dispatch({ type: 'RemoveFeed', feedUri: generator.uri });
		} else {
			dispatch({ type: 'AddFeed', feed: generator });
		}
	};

	return (
		<WizardListCard
			type="algo"
			btnType={btnType}
			displayName={sanitizeDisplayName(generator.displayName)}
			subtitle={`Feed by @${sanitizeHandle(generator.creator.handle)}`}
			onPress={onPress}
			avatar={generator.avatar}
			included={included}
			disabled={disabled}
			moderationUi={moderationUi}
		/>
	);
}
