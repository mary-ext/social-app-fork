import { attachClosestEdge } from '@oomfware/tug/hitbox';

import { clsx } from 'clsx';
import type { Wordgard } from 'wordgard/editor';

import type { AttachmentKind } from '#/lib/media/read-attachment';

import { Button, ButtonIcon } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import type { ThreadDnd } from '../dnd/channel';
import { endOfLastLine, findPostById, getPostParam, getPosts, type PostMedia } from '../editor/schema';
import { findActivePost } from '../editor/selection';
import {
	MEDIA_ID_ATTR,
	MEDIA_INSERT_AFTER_ATTR,
	MEDIA_INSERT_BEFORE_ATTR,
	MEDIA_ROW_ATTR,
} from '../elements';
import { keepEditorFocus, type RovingItemProps } from '../focus';
import { getMediaUrl } from './attachments';
import { moveMediaDown, moveMediaUp, nudgeMedia, removeMedia } from './commands';
import * as styles from './MediaTile.css';

const MEDIA_LABELS: Record<AttachmentKind, string> = {
	gif: 'GIF attachment',
	image: 'Image attachment',
	video: 'Video attachment',
	voice: 'Voice attachment',
};

function MediaPreview({ item, url, tabbable }: { item: PostMedia; url: string; tabbable: boolean }) {
	switch (item.kind) {
		case 'image': {
			return <img className={styles.media} src={url} alt="" />;
		}
		case 'voice': {
			return (
				<audio
					className={styles.audio}
					src={url}
					preload="metadata"
					controls
					// keep native controls out of the tab order unless their tile is tabbable.
					tabIndex={tabbable ? undefined : -1}
				/>
			);
		}
		case 'gif': {
			// GIFs remain images until publishing.
			return <img className={styles.frame} src={url} alt="" />;
		}
		case 'video': {
			return <video className={styles.frame} src={url} preload="metadata" muted />;
		}
	}
}

// moves replace the tile; restore focus so keyboard moves can repeat.
const refocusMedia = (mediaId: string) => {
	requestAnimationFrame(() => {
		document.querySelector<HTMLElement>(`[${MEDIA_ID_ATTR}="${CSS.escape(mediaId)}"]`)?.focus();
	});
};

// move the caret with the tile so its new post's controls stay tabbable.
const followMedia = (wg: Wordgard, mediaId: string) => {
	const post = getPosts(wg.state.doc).find(({ node }) =>
		getPostParam(node).media.some((entry) => entry.id === mediaId),
	);
	if (post && findActivePost(wg.state)?.before !== post.pos) {
		wg.dispatch({ selection: { anchor: endOfLastLine(post.pos + post.node.length) } });
	}

	refocusMedia(mediaId);
};

/**
 * attachment tile with drag and keyboard controls.
 *
 * @param props attachment, post position, editor, drag channel, focus props, and drop indicators
 * @returns the tile
 */
export function MediaTile({
	wg,
	dnd,
	postId,
	index,
	item,
	roving,
	insertBefore,
	insertAfter,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	index: number;
	item: PostMedia;
	roving: RovingItemProps;
	insertBefore: boolean;
	insertAfter: boolean;
}) {
	const url = getMediaUrl(item);
	const isRow = item.kind !== 'image';

	const remove = () => {
		// transfer focus only if the removed tile had it.
		const focused = document.activeElement?.closest(`[${MEDIA_ID_ATTR}]`)?.getAttribute(MEDIA_ID_ATTR);
		const post = findPostById(wg.state.doc, postId);
		const media = post ? getPostParam(post.node).media : [];
		const neighbor = media[index + 1] ?? media[index - 1];

		removeMedia(wg, postId, item.id);
		if (focused !== item.id) {
			return;
		}

		if (neighbor) {
			refocusMedia(neighbor.id);
		} else {
			wg.focus();
		}
	};

	const tileRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		const stopDragging = dnd.draggable({
			element: node,
			// preserve native audio control interaction.
			canDrag: ({ input }) =>
				!(document.elementFromPoint(input.clientX, input.clientY) instanceof HTMLAudioElement),
			getInitialData: () => ({ kind: 'media', postId, mediaId: item.id, index }),
		});

		const stopDropping = dnd.dropTarget({
			element: node,
			canDrop: ({ source }) => source.data.kind === 'media',
			getData: ({ element, input }) =>
				attachClosestEdge(
					{ kind: 'mediaTile', postId, index },
					{ allowedEdges: isRow ? ['top', 'bottom'] : ['left', 'right'], element, input },
				),
		});

		return () => {
			stopDragging();
			stopDropping();
		};
	};

	return (
		<div
			ref={tileRef}
			{...roving}
			className={clsx(styles.tile, item.kind === 'voice' && styles.voice)}
			role="group"
			aria-label={MEDIA_LABELS[item.kind]}
			{...{
				[MEDIA_ID_ATTR]: item.id,
				[MEDIA_ROW_ATTR]: isRow ? '' : undefined,
				[MEDIA_INSERT_BEFORE_ATTR]: insertBefore ? '' : undefined,
				[MEDIA_INSERT_AFTER_ATTR]: insertAfter ? '' : undefined,
			}}
			onKeyDown={(event) => {
				// preserve native keyboard handling in audio controls.
				if (event.target !== event.currentTarget) {
					return;
				}

				if (event.key === 'Backspace' || event.key === 'Delete') {
					event.preventDefault();
					remove();
					return;
				}

				if (!event.altKey) {
					return;
				}

				switch (event.key) {
					case 'ArrowLeft': {
						nudgeMedia(wg, postId, item.id, -1);
						refocusMedia(item.id);
						break;
					}
					case 'ArrowRight': {
						nudgeMedia(wg, postId, item.id, 1);
						refocusMedia(item.id);
						break;
					}
					case 'ArrowUp': {
						moveMediaUp(wg, postId, item.id);
						followMedia(wg, item.id);
						break;
					}
					case 'ArrowDown': {
						moveMediaDown(wg, postId, item.id);
						followMedia(wg, item.id);
						break;
					}
					default: {
						return;
					}
				}

				event.preventDefault();
				event.stopPropagation();
			}}
		>
			<MediaPreview item={item} url={url} tabbable={roving.tabIndex === 0} />

			<div className={styles.tileActions} onMouseDown={keepEditorFocus}>
				{/* Delete and Backspace remove the focused tile. */}
				<Button
					label={m['view.composer.media.removeAttachment']()}
					size="tiny"
					color="secondary_inverted"
					shape="round"
					tabIndex={-1}
					onClick={remove}
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>
		</div>
	);
}
