import { Leaf, Plot, type Slice, Token } from 'wordgard/doc';
import { Wordgard } from 'wordgard/editor';
import { GardSelection } from 'wordgard/state';
import { Paragraph } from 'wordgard/types';

import { attachFiles } from '../media/commands';
import { findPost, getPostParam, newPost, Post } from '../model/schema';

const PARAGRAPH_BREAK: Token[] = [Plot.End, Paragraph];

// three blank lines separate posts in plain text, the same run the third enter consumes.
const POST_SEPARATOR = '\n\n\n\n';
const POST_SEPARATOR_PATTERN = /(\n{4,})/;

/**
 * converts plain text to tokens for insertion inside a paragraph. three or more blank lines separate posts.
 *
 * @param text the pasted plain text
 * @returns the tokens to insert
 */
const tokenizePastedText = (text: string): Token[] => {
	const tokens: Token[] = [];
	// preserve leading/trailing newlines and empty chunks: pasting a bare separator splits the post.
	// split retains captured separators at odd indices.
	const chunks = text.replace(/\r\n?/g, '\n').split(POST_SEPARATOR_PATTERN);

	chunks.forEach((chunk, i) => {
		if (i % 2 === 1) {
			// count consecutive separators to preserve copied empty posts.
			for (let n = Math.floor(chunk.length / POST_SEPARATOR.length); n > 0; n--) {
				tokens.push(Plot.End, Plot.End, newPost(), Paragraph);
			}
			return;
		}

		chunk.split('\n').forEach((line, j) => {
			if (j > 0) {
				tokens.push(...PARAGRAPH_BREAK);
			}
			if (line) {
				tokens.push(Leaf.text(line));
			}
		});
	});

	return tokens;
};

/** pastes as plain text so blank-line runs split posts the same way typing them does. */
export const pastePlainText = Wordgard.pasteHandler.of((wg, event) => {
	const files = event.clipboardData?.files;
	if (files?.length) {
		const post = findPost(wg.state.sel.head);
		if (post) {
			// copy files before the clipboard event expires.
			void attachFiles(wg, getPostParam(post.node).id, [...files]);
		}

		return true;
	}

	const text = event.clipboardData?.getData('text/plain');
	if (!text) {
		return false;
	}

	const { from, to } = wg.state.selection.replacementRange;

	let insert = tokenizePastedText(text);
	// outside a paragraph, wrap the tokens so fitting preserves a leading empty post.
	if (!wg.state.doc.resolve(from).textblockParent) {
		insert = [newPost(), Paragraph, ...insert];
	}

	wg.dispatch({
		changes: { from, to, insert, fit: true },
		selection: (cx, changes) => GardSelection.near(cx, changes.mapPos(to, 1), -1),
		scrollIntoView: true,
		userEvent: 'input.paste',
	});

	return true;
});

/** separates copied posts with blank lines so pasting restores the post boundaries. */
export const copyPlainText = Wordgard.clipboardTextSerializer.of((slice: Slice) => {
	let text = '';
	let separator = '';
	// empty writes still need a separator before the next post or line.
	let written = false;

	const write = (str: string) => {
		text += separator + str;
		separator = '';
		written = true;
	};

	const breakBefore = (type: Plot.Type) => {
		if (written) {
			separator = type === Post ? POST_SEPARATOR : separator || '\n';
		}
	};

	for (const token of slice.content) {
		switch (token.tokenType) {
			case Token.Type.Close: {
				break;
			}

			case Token.Type.Open: {
				breakBefore(token.type);
				break;
			}

			case Token.Type.Node: {
				if (token.isPlot) {
					breakBefore(token.type);
					write(token.textContent({ blockSeparator: '\n' }));
				} else if (token.is(Leaf.Text)) {
					write(token.param);
				}
				break;
			}
		}
	}

	return text;
});
