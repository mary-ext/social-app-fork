import { Trans, useLingui } from '@lingui/react/macro';

import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Prompt from '#/components/web/Prompt';

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
	const { t: l } = useLingui();

	return (
		<>
			<button
				type="button"
				className={styles.playButton}
				aria-label={isPlaying ? l`Pause GIF` : l`Play GIF`}
				onClick={onPress}
			>
				{isLoading ? <Spinner label={l`Loading GIF`} /> : !isPlaying ? <PlayButtonIcon /> : null}
			</button>
			{!isPlaying && <div aria-hidden className={styles.dim} />}
			<div className={styles.gifBadge}>
				<Text size="xs" weight="bold" className={styles.badgeText}>
					<Trans>GIF</Trans>
				</Text>
			</div>
			{altText && <AltBadge text={altText} />}
		</>
	);
}

function AltBadge({ text }: { text: string }) {
	const { t: l } = useLingui();
	const handle = Prompt.usePromptHandle();

	return (
		<>
			<button
				type="button"
				className={styles.altBadge}
				aria-label={l`Show alt text`}
				onClick={() => handle.open(null)}
			>
				<Text size="xs" weight="bold" className={styles.badgeText}>
					<Trans>ALT</Trans>
				</Text>
			</button>
			<Prompt.Outer handle={handle}>
				<Prompt.TitleText>
					<Trans>Alt Text</Trans>
				</Prompt.TitleText>
				<Prompt.DescriptionText>{text}</Prompt.DescriptionText>
				<Prompt.Actions>
					<Prompt.Action onPress={() => {}} cta={l`Close`} color="secondary" />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}
