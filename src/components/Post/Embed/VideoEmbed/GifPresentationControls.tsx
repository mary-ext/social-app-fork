import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

import * as styles from './GifPresentationControls.css';

export function GifPresentationControls({
	onPress,
	isPlaying,
	isLoading,
	altText,
}: {
	onPress: () => void;
	isPlaying: boolean;
	isLoading?: boolean;
	altText?: string;
}) {
	return (
		<>
			<button
				type="button"
				className={styles.playButton}
				aria-label={isPlaying ? m['common.a11y.pauseGif']() : m['common.a11y.playGif']()}
				onClick={onPress}
			>
				{isLoading ? (
					<Spinner label={m['common.label.loadingGif']()} />
				) : !isPlaying ? (
					<PlayButtonIcon />
				) : null}
			</button>
			{!isPlaying && <div aria-hidden className={styles.dim} />}
			<div className={styles.gifBadge}>
				<Text size="xs" weight="bold" className={styles.badgeText}>
					{m['common.label.gif']()}
				</Text>
			</div>
			{altText && <AltBadge text={altText} />}
		</>
	);
}

function AltBadge({ text }: { text: string }) {
	const handle = Prompt.usePromptHandle();

	return (
		<>
			<button
				type="button"
				className={styles.altBadge}
				aria-label={m['common.action.showAltText']()}
				onClick={() => handle.open(null)}
			>
				<Text size="xs" weight="bold" className={styles.badgeText}>
					{m['common.label.altBadge']()}
				</Text>
			</button>
			<Prompt.Outer handle={handle}>
				<Prompt.TitleText>{m['common.label.altTextTitle']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{text}</Prompt.DescriptionText>
				<Prompt.Actions>
					<Prompt.Action onPress={() => {}} cta={m['common.action.close']()} color="secondary" />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}
