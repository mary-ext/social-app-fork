import { useEditorState } from './context';
import { getMediaDrag } from './dnd/drop-indicators';
import { NewPostDropZone } from './dnd/NewPostDropZone';
import { AddPostRow } from './post/AddPostRow';

/**
 * new-post drop zone during media drags; add-post button otherwise.
 *
 * @returns the row
 */
export function ThreadEnd() {
	const drop = useEditorState((state) => {
		const drag = getMediaDrag(state);
		if (!drag) {
			return 'none';
		}
		return drag.drop?.kind === 'newPost' ? 'active' : 'idle';
	});

	if (drop === 'none') {
		return <AddPostRow />;
	}

	return <NewPostDropZone isActive={drop === 'active'} />;
}
