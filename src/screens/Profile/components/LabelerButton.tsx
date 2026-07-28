import type { Did } from '@atcute/lexicons';

import { labelsTarget } from '#/lib/routes/targets';

import { Shield_Stroke2_Corner0_Rounded as ShieldIcon } from '#/components/icons/Shield';
import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './LabelerButton.css';

/** entry point from a labeler account's profile to the labels it publishes. */
export function LabelerButton({ did }: { did: Did }) {
	return (
		<Link
			className={css.pill}
			label={m['screens.profile.labeler.action.viewLabels']()}
			to={labelsTarget(did)}
		>
			<ShieldIcon fill={colors.text} size="sm" />
			<Text size="sm" weight="medium">
				{m['common.moderation.labels']()}
			</Text>
		</Link>
	);
}
