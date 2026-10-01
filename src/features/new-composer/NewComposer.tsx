import { memo } from 'react';

import { createPortal } from 'react-dom';

import { useConstant } from '#/lib/hooks/use-constant';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

import { ComposerContext, useComposer, useEditorState } from './context';
import { createComposer } from './create-composer';
import { getMediaDrag } from './dnd/drop-indicators';
import { MEDIA_DRAGGING_ATTR } from './elements';
import { LinkEmbedRow } from './embeds/LinkEmbedRow';
import { MediaRow } from './media/MediaRow';
import * as styles from './NewComposer.css';
import { PostFooter } from './post/PostFooter';
import { PostHeader } from './post/PostHeader';
import { PostRail } from './post/PostRail';
import { useStore } from './store';
import { Suggestions } from './suggestions/SuggestionPopup';
import { ThreadEnd } from './ThreadEnd';
import { ThreadFooter } from './ThreadFooter';

/**
 * thread composer with shared selection and undo history across posts.
 *
 * @returns the composer header, body and footer
 */
export function NewComposer() {
	const composer = useConstant(createComposer);

	return (
		<ComposerContext value={composer}>
			<Dialog.Header.Root border="scrolling">
				<Dialog.Header.Close />
				<Dialog.Header.Title>{m['view.composer.title.post']()}</Dialog.Header.Title>
			</Dialog.Header.Root>
			<Dialog.Body>
				<ComposerRoot />
			</Dialog.Body>
			<ThreadFooter />
		</ComposerContext>
	);
}

function ComposerRoot() {
	const { mount } = useComposer();
	const isMediaDragging = useEditorState((state) => getMediaDrag(state) !== null);

	return (
		<div ref={mount} className={styles.root} {...{ [MEDIA_DRAGGING_ATTR]: isMediaDragging ? '' : undefined }}>
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

// portals keyed by post id preserve React state while posts are reordered.
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
