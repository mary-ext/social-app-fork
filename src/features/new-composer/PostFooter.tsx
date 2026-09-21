import type { Wordgard } from 'wordgard/editor';

import { openMediaPicker } from '#/lib/media/picker';

import { toPostLanguages, usePostLanguage } from '#/state/preferences/languages';

import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import EmojiIcon from '#/icons/central/EmojiSmile_round_outlined_radius1_stroke2.svg';
import GifIcon from '#/icons/central/GifSquare_round_outlined_radius1_stroke2.svg';
import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { CharCount } from './CharCount';
import { autoSplitPost } from './commands';
import type { PostSummary } from './decorations';
import { keepEditorFocus } from './focus';
import { attachFiles } from './media';
import * as styles from './PostFooter.css';

/**
 * editing controls for a post.
 *
 * @param props the editor and post summary
 * @returns the post's footer
 */
export function PostFooter({ wg, post }: { wg: Wordgard; post: PostSummary }) {
	const languages = toPostLanguages(usePostLanguage());

	return (
		<div className={styles.root} onMouseDown={keepEditorFocus}>
			<div className={styles.actions}>
				<Button
					label={m['common.compose.action.photo']()}
					variant="ghost"
					color="secondary"
					shape="round"
					onClick={() => {
						void openMediaPicker().then((files) => attachFiles(wg, post.id, files));
					}}
				>
					<ButtonIcon icon={ImageIcon} size="lg" />
				</Button>

				<Button label={m['view.composer.gif.a11y.select']()} variant="ghost" color="secondary" shape="round">
					<ButtonIcon icon={GifIcon} size="lg" />
				</Button>

				<Button label={m['common.a11y.openEmojiPicker']()} variant="ghost" color="secondary" shape="round">
					<ButtonIcon icon={EmojiIcon} size="lg" />
				</Button>
			</div>

			<div className={styles.status}>
				{post.isOverLimit && (
					<Button
						label="Split into multiple posts"
						size="tiny"
						color="secondary"
						onClick={() => autoSplitPost(wg, post.id)}
					>
						<ButtonText>Auto-split</ButtonText>
					</Button>
				)}

				<Button
					className={styles.language}
					label={m['view.composer.language.selectPost']()}
					variant="ghost"
					color="secondary"
				>
					<ButtonText size="sm">{languages.join(', ')}</ButtonText>
				</Button>
				<CharCount count={post.length} />
			</div>
		</div>
	);
}
