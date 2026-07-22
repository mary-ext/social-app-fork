import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './NoSavedFeedsOfAnyType.css';

/**
 * banner shown when the user has no saved feeds of any type, offering to apply the recommended set. present
 * this only if the user has no other saved feeds.
 *
 * @param disabled disables the apply button, e.g. while a save is in flight
 * @param onAddRecommendedFeeds invoked when the user applies the recommended feeds; the caller decides
 *   whether that persists immediately or stages into an unsaved draft
 */
export function NoSavedFeedsOfAnyType({
	disabled,
	onAddRecommendedFeeds,
}: {
	disabled?: boolean;
	onAddRecommendedFeeds: () => void;
}) {
	return (
		<div className={css.container}>
			<Text className={css.text} color="textContrastMedium" leading="snug">
				{m['screens.feeds.noSaved']()}
			</Text>
			<Button
				color="primary"
				disabled={disabled}
				label={m['common.feeds.action.applyRecommended']()}
				onClick={onAddRecommendedFeeds}
				size="small"
				variant="outline"
			>
				<ButtonIcon icon={Plus} />
				<ButtonText>{m['screens.feeds.action.useRecommended']()}</ButtonText>
			</Button>
		</div>
	);
}
