import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { usePalette } from '#/lib/hooks/usePalette';
import type { NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import type { FeedDescriptor } from '#/state/queries/post-feed';
import { useRemoveFeedMutation } from '#/state/queries/preferences';

import { logger } from '#/logger';

import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import { EmptyState } from '../util/EmptyState';
import { ErrorMessage } from '../util/error/ErrorMessage';
import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';
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
}: {
	feedDesc: FeedDescriptor;
	error?: Error;
	onPressTryAgain: () => void;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
}) {
	const { t: l } = useLingui();
	const knownError = useMemo(() => detectKnownError(feedDesc, error), [feedDesc, error]);

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
			/>
		);
	}

	if (knownError === KnownError.Block) {
		return <EmptyState icon={WarningIcon} iconSize="2xl" message={l`Posts hidden`} className={css.empty} />;
	}

	return <ErrorMessage message={cleanError(error)} onPressTryAgain={onPressTryAgain} />;
}

function FeedgenErrorMessage({
	feedDesc,
	knownError,
	rawError,
	savedFeedConfig,
}: {
	feedDesc: FeedDescriptor;
	knownError: KnownError;
	rawError?: Error;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
}) {
	const pal = usePalette('default');
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const msg = useMemo(
		() =>
			({
				[KnownError.Unknown]: '',
				[KnownError.Block]: '',
				[KnownError.FeedgenDoesNotExist]: l`Hmm, we're having trouble finding this feed. It may have been deleted.`,
				[KnownError.FeedgenMisconfigured]: l`Hmm, the feed server appears to be misconfigured. Please let the feed owner know about this issue.`,
				[KnownError.FeedgenBadResponse]: l`Hmm, the feed server gave a bad response. Please let the feed owner know about this issue.`,
				[KnownError.FeedgenOffline]: l`Hmm, the feed server appears to be offline. Please let the feed owner know about this issue.`,
				[KnownError.FeedSignedInOnly]: l`This content is not viewable without a Bluesky account.`,
				[KnownError.FeedgenUnknown]: l`Hmm, some kind of issue occurred when contacting the feed server. Please let the feed owner know about this issue.`,
				[KnownError.FeedTooManyRequests]: l`This feed is currently receiving high traffic and is temporarily unavailable. Please try again later.`,
			})[knownError],
		[l, knownError],
	);
	const [__, uri] = feedDesc.split('|');
	const [ownerDid] = safeParseFeedgenUri(uri!);
	const removePromptControl = Prompt.usePromptControl();
	const { mutateAsync: removeFeed } = useRemoveFeedMutation();

	const onViewProfile = useCallback(() => {
		navigation.navigate('Profile', { name: ownerDid });
	}, [navigation, ownerDid]);

	const onPressRemoveFeed = useCallback(() => {
		removePromptControl.open();
	}, [removePromptControl]);

	const onRemoveFeed = useCallback(async () => {
		try {
			if (!savedFeedConfig) return;
			await removeFeed(savedFeedConfig);
		} catch (err) {
			Toast.show(
				l`There was an issue removing this feed. Please check your internet connection and try again.`,
				{ type: 'warning' },
			);
			logger.error('Failed to remove feed', { message: err });
		}
	}, [removeFeed, l, savedFeedConfig]);

	const cta = useMemo(() => {
		switch (knownError) {
			case KnownError.FeedSignedInOnly: {
				return null;
			}
			case KnownError.FeedgenDoesNotExist:
			case KnownError.FeedgenMisconfigured:
			case KnownError.FeedgenBadResponse:
			case KnownError.FeedgenOffline:
			case KnownError.FeedgenUnknown: {
				return (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
						{knownError === KnownError.FeedgenDoesNotExist && savedFeedConfig && (
							<Button type="inverted" label={l`Remove feed`} onPress={onRemoveFeed} />
						)}
						<Button type="default-light" label={l`View profile`} onPress={onViewProfile} />
					</View>
				);
			}
		}
	}, [knownError, onViewProfile, onRemoveFeed, l, savedFeedConfig]);

	return (
		<>
			<View
				style={[
					pal.border,
					pal.viewLight,
					{
						borderTopWidth: 1,
						paddingHorizontal: 20,
						paddingVertical: 18,
						gap: 12,
					},
				]}
			>
				<Text style={pal.text}>{msg}</Text>

				{rawError?.message && (
					<Text style={pal.textLight}>
						<Trans>Message from server: {rawError.message}</Trans>
					</Text>
				)}

				{cta}
			</View>
			<Prompt.Basic
				control={removePromptControl}
				title={l`Remove feed?`}
				description={l`Remove this feed from your saved feeds`}
				onConfirm={onPressRemoveFeed}
				confirmButtonCta={l`Remove`}
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
	const errorString = typeof error === 'string' ? error : String(error);

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
