import { Fragment, memo, type RefObject, useImperativeHandle, useState } from 'react';

import type { AppBskyDraftDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { createPortal } from 'react-dom';

import type { VideoAsset } from '#/lib/media/video/types';

import { closeComposer } from '#/features/composer/open-composer';

import * as Dialog from '#/components/Dialog';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { ComposerContext, useComposer, useEditorState } from './context';
import { createBlankSeed, createComposer } from './create-composer';
import { getMediaDrag } from './dnd/drop-indicators';
import { DraftsButton } from './drafts/DraftsButton';
import { restoreDraft } from './drafts/restore';
import { LinkEmbedRow } from './embeds/LinkEmbedRow';
import { createVideoMedia } from './media/attachments';
import { MediaRow } from './media/MediaRow';
import * as css from './NewComposer.css';
import { PostFooter } from './post/PostFooter';
import { PostHeader } from './post/PostHeader';
import { PostRail } from './post/PostRail';
import { MEDIA_DRAGGING_ATTR } from './shared/elements';
import { useStore } from './store';
import { Suggestions } from './suggestions/SuggestionPopup';
import { DiscardPrompt, useDiscardGuard } from './thread/DiscardPrompt';
import { ReplyParent } from './thread/ReplyParent';
import { ThreadEnd } from './thread/ThreadEnd';
import { ThreadFooter } from './thread/ThreadFooter';

export type ComposerCloseGuard = {
	/**
	 * prompts before closing a nonempty thread.
	 *
	 * @returns whether the dialog should stay open
	 */
	interceptClose: () => boolean;
};

/**
 * thread composer with shared selection and undo history across posts. replyUri, initialText and initialVideo
 * are read only on mount.
 *
 * @param props.quoteUri quote used on mount and when discarding before opening drafts
 * @param props.replyUri reply parent
 * @param props.initialText first post's text
 * @param props.initialVideo first post's video or GIF
 * @param props.closeGuardRef lets the dialog check for unsaved content before closing
 * @returns the composer header, body and footer
 */
export function NewComposer({
	quoteUri,
	replyUri,
	initialText,
	initialVideo,
	closeGuardRef,
}: {
	quoteUri: ResourceUri | undefined;
	replyUri: ResourceUri | undefined;
	initialText: string | undefined;
	initialVideo: VideoAsset | undefined;
	closeGuardRef: RefObject<ComposerCloseGuard | null>;
}) {
	const [composer, setComposer] = useState(() => {
		return createComposer({
			seed: createBlankSeed({
				quoteUri,
				text: initialText,
				media: initialVideo ? [createVideoMedia(initialVideo)] : undefined,
			}),
			replyUri,
		});
	});

	const discard = useDiscardGuard(composer);

	const resetComposer = () => {
		setComposer(createComposer({ seed: createBlankSeed({ quoteUri }), replyUri: undefined }));
	};

	const openDraft = async (view: AppBskyDraftDefs.DraftView) => {
		const { seed, missingMedia } = await restoreDraft(view);

		setComposer(createComposer({ seed, replyUri: undefined }));

		if (missingMedia > 0) {
			Toast.show(`Some attachments aren't available on this device`, { type: 'warning' });
		}
	};

	useImperativeHandle(closeGuardRef, () => ({ interceptClose: discard.intercept }));

	return (
		<ComposerContext value={composer}>
			<Dialog.Header.Root border="scrolling">
				<Dialog.Header.Close />
				<Dialog.Header.Title>
					{composer.replyUri ? m['view.composer.title.reply']() : m['view.composer.title.post']()}
				</Dialog.Header.Title>

				{composer.replyUri === null && (
					<Dialog.Header.Actions>
						<DraftsButton onReset={resetComposer} onSelect={openDraft} />
					</Dialog.Header.Actions>
				)}
			</Dialog.Header.Root>

			{/* reset editor and widget state when opening a draft. */}
			<Fragment key={composer.id}>
				<Dialog.Body>
					<ComposerRoot />
				</Dialog.Body>

				<ThreadFooter />
			</Fragment>

			<DiscardPrompt {...discard.prompt} onProceed={closeComposer} />
		</ComposerContext>
	);
}

function ComposerRoot() {
	const { mount, replyUri } = useComposer();
	const isMediaDragging = useEditorState((state) => getMediaDrag(state) !== null);

	return (
		<div ref={mount} className={css.root} {...{ [MEDIA_DRAGGING_ATTR]: isMediaDragging ? '' : undefined }}>
			{replyUri && <ReplyParent uri={replyUri} />}

			<PostSlots />
			<ThreadEndPortal />
			<Suggestions />
		</div>
	);
}

function ThreadEndPortal() {
	const { endHost } = useComposer();
	return createPortal(<ThreadEnd />, endHost);
}

// post-id keys preserve unaffected portals' state. moved posts get new slot elements and remount.
function PostSlots() {
	const { slots } = useComposer();

	return useStore(slots).map(({ kind, element, postId }) => {
		switch (kind) {
			case 'header': {
				return createPortal(<HeaderSlot postId={postId} />, element, `header:${postId}`);
			}
			case 'footer': {
				return createPortal(<FooterSlot postId={postId} />, element, `footer:${postId}`);
			}
		}
	});
}

const HeaderSlot = memo(function HeaderSlot({ postId }: { postId: string }) {
	return (
		<>
			<PostRail postId={postId} />
			<PostHeader postId={postId} />
		</>
	);
});

const FooterSlot = memo(function FooterSlot({ postId }: { postId: string }) {
	return (
		<>
			<MediaRow postId={postId} />
			<LinkEmbedRow postId={postId} />
			<PostFooter postId={postId} />
		</>
	);
});
