import type { Did } from '@atcute/lexicons';

import { labelsTarget } from '#/lib/routes/targets';

import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import ShieldIcon from '#/icons/central/Shield_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './LabelerButton.css';

/** entry point from a labeler account's profile to the labels it publishes. */
export function LabelerButton({ did }: { did: Did }) {
	return (
		<Link
			className={css.pill}
			label={m['screens.profile.labeler.action.viewLabels']()}
			to={labelsTarget(did)}
		>
			<ShieldIcon className={css.shieldIcon} />
			<Text size="sm" weight="medium">
				{m['common.moderation.labels']()}
			</Text>
		</Link>
	);
}
