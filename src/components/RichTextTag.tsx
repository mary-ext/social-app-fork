import type { MouseEvent } from 'react';
import { useNavigation } from '@react-navigation/native';
import { clsx } from 'clsx';

import type { NavigationProp } from '#/lib/routes/types';
import { isInvalidHandle } from '#/lib/strings/handles';

import {
	usePreferencesQuery,
	useRemoveMutedWordsMutation,
	useUpsertMutedWordsMutation,
} from '#/state/queries/preferences';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as Search } from '#/components/icons/MagnifyingGlass';
import { Mute_Stroke2_Corner0_Rounded as Mute } from '#/components/icons/Mute';
import { Person_Stroke2_Corner0_Rounded as Person } from '#/components/icons/Person';
import { useLink } from '#/components/Link';
import * as Menu from '#/components/Menu';
import { atomicSegment } from '#/components/RichText.css';
import { Spinner } from '#/components/Spinner';
import type { TextProps } from '#/components/Text';
import * as textStyles from '#/components/Text.css';
import type { InlineLinkUnderline } from '#/components/web/Link';
import * as linkStyles from '#/components/web/Link.css';

import { m } from '#/paraglide/messages';

const preventDefault = (e: MouseEvent) => e.preventDefault();

export type RichTextTagProps = Pick<TextProps, 'color' | 'leading' | 'size'> & {
	authorHandle?: string;
	display: string;
	tag: string;
	underline?: InlineLinkUnderline;
};

/**
 * An inline hashtag/cashtag within {@link RichText}: a link to the tag's feed that opens a context menu
 * (browse the tag, browse it by the post's author, mute/unmute) on click. A left-click always opens the menu;
 * the anchor's href is kept so middle/right-click still open the tag's feed in a new tab.
 */
const MenuSpinner = () => <Spinner color="default" label={m['common.status.loading']()} size="lg" />;

export function RichTextTag({
	authorHandle,
	color = 'primary_500',
	display,
	leading,
	size,
	tag,
	underline = 'hover',
}: RichTextTagProps) {
	const navigation = useNavigation<NavigationProp>();
	const { isLoading: isPreferencesLoading, data: preferences } = usePreferencesQuery();
	const {
		mutateAsync: upsertMutedWord,
		variables: optimisticUpsert,
		reset: resetUpsert,
	} = useUpsertMutedWordsMutation();
	const {
		mutateAsync: removeMutedWords,
		variables: optimisticRemove,
		reset: resetRemove,
	} = useRemoveMutedWordsMutation();
	const { href } = useLink({ displayText: display, to: { params: { tag }, screen: 'Hashtag' } });

	const isCashtag = tag.startsWith('$');
	const label = isCashtag
		? m['components.richTextTag.a11y.cashtag']({ tag })
		: m['components.richTextTag.a11y.hashtag']({ tag });
	const prefixedTag = isCashtag ? tag : `#${tag}`;

	const isMuted = Boolean(
		(preferences?.moderationPrefs.mutedWords?.find((m) => m.value === tag && m.targets.includes('tag')) ??
			optimisticUpsert?.find((m) => m.value === tag && m.targets.includes('tag'))) &&
		!optimisticRemove?.find((m) => m?.value === tag),
	);

	// mute records that exactly match the tag in question
	const removeableMuteWords =
		preferences?.moderationPrefs.mutedWords?.filter((word) => word.value === tag) ?? [];

	return (
		<Menu.Root>
			<Menu.Trigger
				aria-label={label}
				className={clsx(
					textStyles.text({ color, leading, size }),
					linkStyles.inlineLink({ underline }),
					atomicSegment,
				)}
				nativeButton={false}
				// the anchor exists only for its href (hover preview, middle/right-click "open in new tab"); a
				// plain left-click always opens the menu, so suppress the native navigation it would trigger
				onClick={preventDefault}
				render={<a href={href} />}
			>
				{display}
			</Menu.Trigger>
			<Menu.Popup label={label}>
				<Menu.Group>
					<Menu.Item
						label={m['components.richTextTag.seePosts.prefixed']({ prefixedTag })}
						onClick={() => navigation.push('Hashtag', { tag })}
					>
						<Menu.ItemText>
							{isCashtag
								? m['components.richTextTag.seePosts.tag']({ tag })
								: m['components.richTextTag.seePosts.hash']({ tag })}
						</Menu.ItemText>
						<Menu.ItemIcon icon={Search} />
					</Menu.Item>
					{authorHandle && !isInvalidHandle(authorHandle) && (
						<Menu.Item
							label={m['components.richTextTag.seePosts.prefixedByUser']({ prefixedTag })}
							onClick={() => navigation.push('Hashtag', { author: authorHandle, tag })}
						>
							<Menu.ItemText>
								{isCashtag
									? m['components.richTextTag.seePosts.tagByUser']({ tag })
									: m['components.richTextTag.seePosts.hashByUser']({ tag })}
							</Menu.ItemText>
							<Menu.ItemIcon icon={Person} />
						</Menu.Item>
					)}
				</Menu.Group>
				<Menu.Separator />
				<Menu.Item
					label={
						isMuted
							? m['components.richTextTag.unmute']({ prefixedTag })
							: m['components.richTextTag.mute']({ prefixedTag })
					}
					onClick={() => {
						if (isMuted) {
							resetUpsert();
							void removeMutedWords(removeableMuteWords);
						} else {
							resetRemove();
							void upsertMutedWord([{ actorTarget: 'all', targets: ['tag'], value: tag }]);
						}
					}}
				>
					<Menu.ItemText>
						{isMuted
							? m['components.richTextTag.unmute']({ prefixedTag })
							: m['components.richTextTag.mute']({ prefixedTag })}
					</Menu.ItemText>
					<Menu.ItemIcon icon={isPreferencesLoading ? MenuSpinner : Mute} />
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}
