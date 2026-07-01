import { clsx } from 'clsx';

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
				aria-label={isPlaying ? m['common.gif.a11y.pause']() : m['common.gif.a11y.play']()}
				onClick={onPress}
			>
				{isLoading ? <Spinner label={m['common.gif.loading']()} /> : !isPlaying ? <PlayButtonIcon /> : null}
			</button>
			{!isPlaying && <div aria-hidden className={styles.dim} />}
			<div className={styles.gifBadge}>
				<Text size="xs" weight="bold" className={styles.badgeText}>
					{m['common.gif.label']()}
				</Text>
			</div>
			{altText && <AltBadge text={altText} />}
		</>
	);
}

export function AltBadge({
	text,
	position = 'bottom-right',
}: {
	text: string;
	position?: 'bottom-right' | 'top-right';
}) {
	const handle = Prompt.usePromptHandle();

	return (
		<>
			<button
				type="button"
				className={clsx(styles.altBadge, position === 'top-right' && styles.altBadgeTopRight)}
				aria-label={m['common.altText.show']()}
				onClick={() => handle.open(null)}
			>
				<Text size="xs" weight="bold" className={styles.badgeText}>
					{m['common.altText.badge']()}
				</Text>
			</button>
			<Prompt.Outer handle={handle}>
				<Prompt.TitleText>{m['common.altText.title']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{text}</Prompt.DescriptionText>
				<Prompt.Actions>
					<Prompt.Action onPress={() => {}} cta={m['common.action.close']()} color="secondary" />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}
