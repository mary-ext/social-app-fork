import { memo, type RefObject, useImperativeHandle, useState } from 'react';

import { createPortal } from 'react-dom';

import { useConstant } from '#/lib/hooks/use-constant';

import type { DraftSaveBlocker } from '#/features/composer/drafts/state/api';
import { closeComposer } from '#/features/composer/open-composer';

import * as Dialog from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';

import { m } from '#/paraglide/messages';

import { ComposerContext, useComposer, useEditorState } from './context';
import { type ComposerInit, createComposer } from './create-composer';
import { getMediaDrag } from './dnd/drop-indicators';
import { getDraftSaveBlocker } from './drafts/save-blocker';
import { LinkEmbedRow } from './embeds/LinkEmbedRow';
import { MediaRow } from './media/MediaRow';
import { hasThreadContent } from './model/schema';
import * as css from './NewComposer.css';
import { PostFooter } from './post/PostFooter';
import { PostHeader } from './post/PostHeader';
import { PostRail } from './post/PostRail';
import { MEDIA_DRAGGING_ATTR } from './shared/elements';
import { useStore } from './store';
import { Suggestions } from './suggestions/SuggestionPopup';
import { DiscardPrompt } from './thread/DiscardPrompt';
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
 * thread composer with shared selection and undo history across posts.
 *
 * @param props.quoteUri initial quote; ignored after mount
 * @param props.replyUri reply parent; ignored after mount
 * @param props.closeGuardRef lets the dialog check for unsaved content before closing
 * @returns the composer header, body and footer
 */
export function NewComposer({
	quoteUri,
	replyUri,
	closeGuardRef,
}: ComposerInit & {
	closeGuardRef: RefObject<ComposerCloseGuard | null>;
}) {
	const composer = useConstant(() => createComposer({ quoteUri, replyUri }));

	const discardPromptHandle = Prompt.usePromptHandle();
	const [draftSaveBlocker, setDraftSaveBlocker] = useState<DraftSaveBlocker>();

	const interceptClose = (): boolean => {
		const { doc } = composer.wg.state;
		if (!hasThreadContent(doc)) {
			return false;
		}

		setDraftSaveBlocker(getDraftSaveBlocker(doc));
		discardPromptHandle.open(null);
		return true;
	};

	useImperativeHandle(closeGuardRef, () => ({ interceptClose }));

	return (
		<ComposerContext value={composer}>
			<Dialog.Header.Root border="scrolling">
				<Dialog.Header.Close />
				<Dialog.Header.Title>
					{composer.replyUri ? m['view.composer.title.reply']() : m['view.composer.title.post']()}
				</Dialog.Header.Title>
			</Dialog.Header.Root>
			<Dialog.Body>
				<ComposerRoot />
			</Dialog.Body>
			<ThreadFooter />

			<DiscardPrompt
				handle={discardPromptHandle}
				isReply={composer.replyUri !== null}
				draftSaveBlocker={draftSaveBlocker}
				onDiscard={closeComposer}
			/>
		</ComposerContext>
	);
}

function ComposerRoot() {
	const { mount, replyUri } = useComposer();
	const isMediaDragging = useEditorState((state) => getMediaDrag(state) !== null);

	// the editor mounts after React's children, keeping the reply parent above it.
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

// the compiler doesn't memoize JSX in the map callback; explicit memoization avoids rerendering
// unchanged posts when slots change.
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
