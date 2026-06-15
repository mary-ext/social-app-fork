import { Plural, Trans } from '@lingui/react/macro';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import * as css from './Card.css';
import type { ChatInvitePreview } from './use-chat-invite';

/**
 * Presentational preview of a chat invite: member avatars, group name, member count, and owner. Renders
 * nothing without a preview (use a fallback alongside it for that case).
 */
export function Card({ preview }: { preview: ChatInvitePreview | undefined }) {
	if (!preview) return null;

	const ownerDisplayName = createSanitizedDisplayName(preview.owner);
	const ownerHandle = sanitizeHandle(preview.owner.handle, '@');
	const avatarProfiles = preview.convo?.members ?? [preview.owner];

	return (
		<div className={css.row}>
			<AvatarBubbles size={56} self profiles={avatarProfiles} count={preview.memberCount} />
			<div className={css.body}>
				<Text size="md" weight="medium" numberOfLines={1}>
					{preview.name}
				</Text>
				<div className={css.metaRow}>
					<Text size="xs" weight="medium" color="textContrastMedium" numberOfLines={1}>
						<Trans>Group chat</Trans>
					</Text>
					<Text size="xs" weight="medium" color="textContrastMedium" numberOfLines={1}>
						<Trans comment="The number of members in a group chat, in the format '{members}/{total} members'.">
							{preview.memberCount}/{preview.memberLimit}{' '}
							<Plural value={preview.memberLimit} one="member" other="members" />
						</Trans>
					</Text>
				</div>

				<div className={css.ownerRow}>
					<Text size="md_sub" weight="medium" numberOfLines={1} className={css.shrink}>
						<Trans comment="The group chat creator">
							by{' '}
							<InlineLinkText
								to={makeProfileLink(preview.owner)}
								label={ownerDisplayName}
								size="md_sub"
								color="text"
								weight="medium"
							>
								{ownerDisplayName}
							</InlineLinkText>
						</Trans>
					</Text>

					<ProfileBadges profile={preview.owner} size="sm" />

					<Text size="md_sub" color="textContrastMedium" numberOfLines={1} className={css.shrink}>
						{ownerHandle}
					</Text>
				</div>
			</div>
		</div>
	);
}
