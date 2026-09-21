import { Command, deleteUnit, deleteWord, enter, selectAll } from 'wordgard/command';
import { KeyBinding } from 'wordgard/editor';
import { type GardState, Transaction } from 'wordgard/state';

import { selectPost } from '../editor/selection';
import { copyPlainText, pastePlainText } from './clipboard';
import { joinPosts, preserveJoinedMedia } from './join-posts';
import { movePost } from './reorder-posts';
import { splitOnBlankLines, splitPost } from './split-post';

/** extension with the thread's editing behavior. */
export const threadCommands: GardState.Extension = [
	Command.handler(enter, splitOnBlankLines),
	Command.handler(deleteUnit, joinPosts),
	Command.handler(deleteWord, joinPosts),
	Command.handler(selectAll, selectPost),
	KeyBinding.of({ key: 'Mod-Enter', run: splitPost }),
	KeyBinding.of({ key: 'Alt-ArrowUp', run: (wg) => movePost(wg, -1) }),
	KeyBinding.of({ key: 'Alt-ArrowDown', run: (wg) => movePost(wg, 1) }),
	pastePlainText,
	copyPlainText,
	Transaction.extender.of(preserveJoinedMedia),
];
