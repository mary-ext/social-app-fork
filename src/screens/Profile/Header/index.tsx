import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AppBskyActorDefs, AppBskyLabelerDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';

import { useTheme } from '#/alf';

import { LabelerProfileHeader } from './Labeler';
import { StandardProfileHeader } from './Standard';

let ProfileHeaderLoading = (_props: {}): React.ReactNode => {
	const t = useTheme();
	return (
		<View style={t.atoms.bg}>
			<LoadingPlaceholder width="100%" height={150} style={{ borderRadius: 0 }} />
			<View style={[t.atoms.bg, { borderColor: t.atoms.bg.backgroundColor }, styles.avi]}>
				<LoadingPlaceholder width={90} height={90} style={styles.br45} />
			</View>
			<View style={styles.content}>
				<View style={[styles.buttonsLine]}>
					<LoadingPlaceholder width={140} height={34} style={styles.br50} />
				</View>
			</View>
		</View>
	);
};
ProfileHeaderLoading = memo(ProfileHeaderLoading);
export { ProfileHeaderLoading };

interface Props {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	labeler: AppBskyLabelerDefs.LabelerViewDetailed | undefined;
	descriptionRT: Richtext | null;
	moderationOpts: ModerationOptions;
	hideBackButton?: boolean;
	isPlaceholderProfile?: boolean;
	setMinimumHeight: (height: number) => void;
}

/** Routes to the labeler or standard header variant; `setMinimumHeight` is a no-op on web. */
let ProfileHeader = ({ setMinimumHeight, ...props }: Props): React.ReactNode => {
	if (props.profile.associated?.labeler) {
		if (!props.labeler) {
			return <ProfileHeaderLoading />;
		}
		return <LabelerProfileHeader {...props} labeler={props.labeler} />;
	}
	return <StandardProfileHeader {...props} />;
};
ProfileHeader = memo(ProfileHeader);
export { ProfileHeader };

const styles = StyleSheet.create({
	avi: {
		position: 'absolute',
		top: 110,
		left: 10,
		width: 94,
		height: 94,
		borderRadius: 47,
		borderWidth: 2,
	},
	content: {
		paddingTop: 12,
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	buttonsLine: {
		flexDirection: 'row',
		marginLeft: 'auto',
	},
	br45: { borderRadius: 45 },
	br50: { borderRadius: 50 },
});
