import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';
import { cleanError, errorToString } from '#/lib/strings/errors';

import type { FeedDescriptor } from '#/state/queries/post-feed';
import { useRemoveFeedMutation } from '#/state/queries/preferences';

import { logger } from '#/logger';

import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { EmptyState } from '../util/EmptyState';
import { ErrorMessage } from '../util/error/ErrorMessage';
import * as css from './PostFeedErrorMessage.css';

export enum KnownError {
	Block = 'Block',
	FeedgenDoesNotExist = 'FeedgenDoesNotExist',
	FeedgenMisconfigured = 'FeedgenMisconfigured',
	FeedgenBadResponse = 'FeedgenBadResponse',
	FeedgenOffline = 'FeedgenOffline',
	FeedgenUnknown = 'FeedgenUnknown',
	FeedSignedInOnly = 'FeedSignedInOnly',
	FeedTooManyRequests = 'FeedTooManyRequests',
	Unknown = 'Unknown',
}

export function PostFeedErrorMessage({
	feedDesc,
	error,
	onPressTryAgain,
	savedFeedConfig,
	topBorder = false,
}: {
	feedDesc: FeedDescriptor;
	error?: Error;
	onPressTryAgain: () => void;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
	topBorder?: boolean;
}) {
	const knownError = detectKnownError(feedDesc, error);

	if (
		typeof knownError !== 'undefined' &&
		knownError !== KnownError.Unknown &&
		feedDesc.startsWith('feedgen')
	) {
		return (
			<FeedgenErrorMessage
				feedDesc={feedDesc}
				knownError={knownError}
				rawError={error}
				savedFeedConfig={savedFeedConfig}
				topBorder={topBorder}
			/>
		);
	}

	if (knownError === KnownError.Block) {
		return (
			<EmptyState
				icon={WarningIcon}
				iconSize="2xl"
				message={m['view.posts.moderation.hidden']()}
				className={css.empty}
			/>
		);
	}

	return <ErrorMessage message={cleanError(error)} onPressTryAgain={onPressTryAgain} />;
}

function FeedgenErrorMessage({
	feedDesc,
	knownError,
	rawError,
	savedFeedConfig,
	topBorder,
}: {
	feedDesc: FeedDescriptor;
	knownError: KnownError;
	rawError?: Error;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
	topBorder: boolean;
}) {
	const navigation = useNavigation<NavigationProp>();
	const msg = {
		[KnownError.Unknown]: '',
		[KnownError.Block]: '',
		[KnownError.FeedgenDoesNotExist]: m['view.posts.feed.error.notFound'](),
		[KnownError.FeedgenMisconfigured]: m['view.posts.feed.error.misconfigured'](),
		[KnownError.FeedgenBadResponse]: m['view.posts.feed.error.badResponse'](),
		[KnownError.FeedgenOffline]: m['view.posts.feed.error.offline'](),
		[KnownError.FeedSignedInOnly]: m['view.posts.feed.requiresAccount'](),
		[KnownError.FeedgenUnknown]: m['view.posts.feed.error.serverRequest'](),
		[KnownError.FeedTooManyRequests]: m['view.posts.feed.error.highTraffic'](),
	}[knownError];
	const [__, uri] = feedDesc.split('|');
	const [ownerDid] = safeParseFeedgenUri(uri!);
	const removePromptHandle = Prompt.usePromptHandle();
	const { mutateAsync: removeFeed } = useRemoveFeedMutation();

	const onViewProfile = () => {
		navigation.navigate('Profile', { name: ownerDid });
	};

	const onPressRemoveFeed = () => {
		removePromptHandle.open(null);
	};

	const onRemoveFeed = async () => {
		try {
			if (!savedFeedConfig) return;
			await removeFeed(savedFeedConfig);
		} catch (err) {
			Toast.show(m['view.posts.feed.remove.error'](), { type: 'warning' });
			logger.error('Failed to remove feed', { message: err });
		}
	};

	let cta: React.ReactNode;
	switch (knownError) {
		case KnownError.FeedSignedInOnly: {
			cta = null;
			break;
		}
		case KnownError.FeedgenDoesNotExist:
		case KnownError.FeedgenMisconfigured:
		case KnownError.FeedgenBadResponse:
		case KnownError.FeedgenOffline:
		case KnownError.FeedgenUnknown: {
			cta = (
				<div className={css.cta}>
					{knownError === KnownError.FeedgenDoesNotExist && savedFeedConfig && (
						<Button
							color="secondary_inverted"
							label={m['view.posts.feed.remove.label']()}
							onClick={onPressRemoveFeed}
						>
							<ButtonText>{m['view.posts.feed.remove.label']()}</ButtonText>
						</Button>
					)}
					<Button color="secondary" label={m['common.profile.action.view']()} onClick={onViewProfile}>
						<ButtonText>{m['common.profile.action.view']()}</ButtonText>
					</Button>
				</div>
			);
			break;
		}
	}

	return (
		<>
			<div className={css.container({ topBorder })}>
				<Text>{msg}</Text>

				{rawError?.message && (
					<Text color="textContrastMedium">
						{m['view.posts.feed.error.serverMessage']({ message: rawError.message })}
					</Text>
				)}

				{cta}
			</div>
			<Prompt.Basic
				handle={removePromptHandle}
				title={m['view.posts.feed.remove.title']()}
				description={m['view.posts.feed.remove.message']()}
				onConfirm={() => void onRemoveFeed()}
				confirmButtonCta={m['common.action.remove']()}
				confirmButtonColor="negative"
			/>
		</>
	);
}

function safeParseFeedgenUri(uri: string): [string, string] {
	try {
		const urip = parseCanonicalResourceUri(uri);
		return [urip.repo, urip.rkey];
	} catch {
		return ['', ''];
	}
}

function detectKnownError(feedDesc: FeedDescriptor, error: unknown): KnownError | undefined {
	if (!error) {
		return undefined;
	}
	if (
		error instanceof ClientResponseError &&
		(error.error === 'BlockedActor' || error.error === 'BlockedByActor')
	) {
		return KnownError.Block;
	}

	// check status codes
	if (typeof error === 'object' && error !== null && 'status' in error && error.status === 429) {
		return KnownError.FeedTooManyRequests;
	}

	// convert error to string and continue
	const errorString = errorToString(error);

	if (errorString.includes(KnownError.FeedSignedInOnly)) {
		return KnownError.FeedSignedInOnly;
	}
	if (!feedDesc.startsWith('feedgen')) {
		return KnownError.Unknown;
	}
	if (errorString.includes('could not find feed')) {
		return KnownError.FeedgenDoesNotExist;
	}
	if (errorString.includes('feed unavailable')) {
		return KnownError.FeedgenOffline;
	}
	if (errorString.includes('invalid did document')) {
		return KnownError.FeedgenMisconfigured;
	}
	if (errorString.includes('could not resolve did document')) {
		return KnownError.FeedgenMisconfigured;
	}
	if (errorString.includes('invalid feed generator service details in did document')) {
		return KnownError.FeedgenMisconfigured;
	}
	if (errorString.includes('invalid response')) {
		return KnownError.FeedgenBadResponse;
	}
	return KnownError.FeedgenUnknown;
}
