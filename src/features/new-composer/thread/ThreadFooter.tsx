import { interactionSettingsFromPreferences } from '#/lib/interaction-settings';

import { usePreferencesQuery } from '#/state/queries/preferences';

import { ThreadgateBtn } from '#/features/composer/threadgate/ThreadgateBtn';

import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { useComposer, usePostCount } from '../context';
import { useStore } from '../store';
import * as css from './ThreadFooter.css';

/**
 * thread interaction settings and publish button.
 *
 * @returns the pinned footer row
 */
export function ThreadFooter() {
	return (
		<div className={css.root}>
			<div className={css.start}>
				<InteractionSettingsButton />
			</div>

			<div className={css.end}>
				<PublishButton />
			</div>
		</div>
	);
}

function InteractionSettingsButton() {
	const { interaction } = useComposer();
	const edited = useStore(interaction);
	const { data: preferences } = usePreferencesQuery();

	// follow account defaults until the thread's settings are edited.
	const settings = edited ?? interactionSettingsFromPreferences(preferences?.postInteractionSettings);

	return <ThreadgateBtn value={settings} onChange={interaction.set} />;
}

function PublishButton() {
	const isThread = usePostCount() > 1;
	const publishLabel = isThread
		? m['view.composer.publish.a11y.posts']()
		: m['view.composer.publish.a11y.post']();
	const publishText = isThread ? m['view.composer.publish.action.all']() : m['navigation.post.title']();

	// TODO: publish the thread.
	return (
		<Button color="primary" size="small" label={publishLabel}>
			<ButtonText>{publishText}</ButtonText>
		</Button>
	);
}
