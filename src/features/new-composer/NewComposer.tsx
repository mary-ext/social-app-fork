import { memo } from 'react';

import { createPortal } from 'react-dom';

import { useConstant } from '#/lib/hooks/use-constant';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

import { ComposerContext, useComposer, useEditorState } from './context';
import { type ComposerInit, createComposer } from './create-composer';
import { getMediaDrag } from './dnd/drop-indicators';
import { LinkEmbedRow } from './embeds/LinkEmbedRow';
import { MediaRow } from './media/MediaRow';
import * as css from './NewComposer.css';
import { PostFooter } from './post/PostFooter';
import { PostHeader } from './post/PostHeader';
import { PostRail } from './post/PostRail';
import { MEDIA_DRAGGING_ATTR } from './shared/elements';
import { useStore } from './store';
import { Suggestions } from './suggestions/SuggestionPopup';
import { ReplyParent } from './thread/ReplyParent';
import { ThreadEnd } from './thread/ThreadEnd';
import { ThreadFooter } from './thread/ThreadFooter';

/**
 * thread composer with shared selection and undo history across posts.
 *
 * @param props initial quote and reply URIs; ignored after mount
 * @returns the composer header, body and footer
 */
export function NewComposer(props: ComposerInit) {
	const composer = useConstant(() => createComposer(props));

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
