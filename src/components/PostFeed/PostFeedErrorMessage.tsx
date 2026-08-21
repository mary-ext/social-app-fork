import type { ReactNode } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { cleanError, errorToString } from '#/lib/errors';
import { profileTarget } from '#/lib/routes/targets';

import type { FeedDescriptor } from '#/state/queries/feed-descriptor';
import { PostFeedErrorCode } from '#/state/queries/post-feed-error';
import { useRemoveFeedMutation } from '#/state/queries/preferences';

import { EmptyState } from '#/components/EmptyState';
import { ErrorMessage } from '#/components/ErrorMessage';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import * as css from './PostFeedErrorMessage.css';

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
		knownError !== PostFeedErrorCode.Unknown &&
		feedDesc.type === 'feedgen'
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

	if (knownError === PostFeedErrorCode.Block) {
		return (
			<EmptyState
				icon={WarningIcon}
				iconSize="_2xl"
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
	feedDesc: Extract<FeedDescriptor, { type: 'feedgen' }>;
	knownError: PostFeedErrorCode;
	rawError?: Error;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
	topBorder: boolean;
}) {
	const router = useRouter();
	const msg = {
		[PostFeedErrorCode.Unknown]: '',
		[PostFeedErrorCode.Block]: '',
		[PostFeedErrorCode.FeedgenDoesNotExist]: m['view.posts.feed.error.notFound'](),
		[PostFeedErrorCode.FeedgenMisconfigured]: m['view.posts.feed.error.misconfigured'](),
		[PostFeedErrorCode.FeedgenBadResponse]: m['view.posts.feed.error.badResponse'](),
		[PostFeedErrorCode.FeedgenOffline]: m['view.posts.feed.error.offline'](),
		[PostFeedErrorCode.FeedSignedInOnly]: m['view.posts.feed.requiresAccount'](),
		[PostFeedErrorCode.FeedgenUnknown]: m['view.posts.feed.error.serverRequest'](),
		[PostFeedErrorCode.FeedTooManyRequests]: m['view.posts.feed.error.highTraffic'](),
	}[knownError];
	const ownerDid = safeParseFeedgenOwnerDid(feedDesc.uri);
	const removePromptHandle = Prompt.usePromptHandle();
	const { mutateAsync: removeFeed } = useRemoveFeedMutation();

	const onViewProfile = () => {
		if (ownerDid) {
			router.navigate({ to: profileTarget(ownerDid) });
		}
	};

	const onPressRemoveFeed = () => {
		removePromptHandle.open(null);
	};

	const onRemoveFeed = async () => {
		try {
			if (!savedFeedConfig) {
				return;
			}
			await removeFeed(savedFeedConfig);
		} catch (err) {
			console.error('Failed to remove feed', err);
			Toast.show(m['view.posts.feed.remove.error'](), { type: 'warning' });
		}
	};

	let cta: ReactNode;
	switch (knownError) {
		case PostFeedErrorCode.FeedSignedInOnly: {
			cta = null;
			break;
		}
		case PostFeedErrorCode.FeedgenDoesNotExist:
		case PostFeedErrorCode.FeedgenMisconfigured:
		case PostFeedErrorCode.FeedgenBadResponse:
		case PostFeedErrorCode.FeedgenOffline:
		case PostFeedErrorCode.FeedgenUnknown: {
			cta = (
				<div className={css.cta}>
					{knownError === PostFeedErrorCode.FeedgenDoesNotExist && savedFeedConfig && (
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

function safeParseFeedgenOwnerDid(uri: string): Did | undefined {
	try {
		return parseCanonicalResourceUri(uri).repo;
	} catch {
		return undefined;
	}
}

function detectKnownError(feedDesc: FeedDescriptor, error: unknown): PostFeedErrorCode | undefined {
	if (!error) {
		return undefined;
	}
	if (
		error instanceof ClientResponseError &&
		(error.error === 'BlockedActor' || error.error === 'BlockedByActor')
	) {
		return PostFeedErrorCode.Block;
	}

	// check status codes
	if (typeof error === 'object' && error !== null && 'status' in error && error.status === 429) {
		return PostFeedErrorCode.FeedTooManyRequests;
	}

	// convert error to string and continue
	const errorString = errorToString(error);

	if (errorString.includes(PostFeedErrorCode.FeedSignedInOnly)) {
		return PostFeedErrorCode.FeedSignedInOnly;
	}
	if (feedDesc.type !== 'feedgen') {
		return PostFeedErrorCode.Unknown;
	}
	if (errorString.includes('could not find feed')) {
		return PostFeedErrorCode.FeedgenDoesNotExist;
	}
	if (errorString.includes('feed unavailable')) {
		return PostFeedErrorCode.FeedgenOffline;
	}
	if (errorString.includes('invalid did document')) {
		return PostFeedErrorCode.FeedgenMisconfigured;
	}
	if (errorString.includes('could not resolve did document')) {
		return PostFeedErrorCode.FeedgenMisconfigured;
	}
	if (errorString.includes('invalid feed generator service details in did document')) {
		return PostFeedErrorCode.FeedgenMisconfigured;
	}
	if (errorString.includes('invalid response')) {
		return PostFeedErrorCode.FeedgenBadResponse;
	}
	return PostFeedErrorCode.FeedgenUnknown;
}
