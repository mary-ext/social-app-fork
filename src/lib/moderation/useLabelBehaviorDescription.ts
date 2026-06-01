import type { InterpretedLabelDefinition, LabelPreference } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

export function useLabelBehaviorDescription(
	labelValueDef: InterpretedLabelDefinition,
	pref: LabelPreference,
) {
	const { t: l } = useLingui();
	if (pref === 'ignore') {
		return l`Off`;
	}
	if (labelValueDef.blur === 'content' || labelValueDef.blur === 'media' || labelValueDef.blur === 'forced') {
		if (pref === 'hide') {
			return l`Hide`;
		}
		return l`Warn`;
	} else if (labelValueDef.severity === 'alert') {
		if (pref === 'hide') {
			return l`Hide`;
		}
		return l`Warn`;
	} else if (labelValueDef.severity === 'inform') {
		if (pref === 'hide') {
			return l`Hide`;
		}
		return l`Show badge`;
	} else {
		if (pref === 'hide') {
			return l`Hide`;
		}
		return l`Disabled`;
	}
}

export function useLabelLongBehaviorDescription(
	labelValueDef: InterpretedLabelDefinition,
	pref: LabelPreference,
) {
	const { t: l } = useLingui();
	if (pref === 'ignore') {
		return l`Disabled`;
	}
	if (labelValueDef.blur === 'content' || labelValueDef.blur === 'forced') {
		if (pref === 'hide') {
			return l`Warn content and filter from feeds`;
		}
		return l`Warn content`;
	} else if (labelValueDef.blur === 'media') {
		if (pref === 'hide') {
			return l`Blur images and filter from feeds`;
		}
		return l`Blur images`;
	} else if (labelValueDef.severity === 'alert') {
		if (pref === 'hide') {
			return l`Show warning and filter from feeds`;
		}
		return l`Show warning`;
	} else if (labelValueDef.severity === 'inform') {
		if (pref === 'hide') {
			return l`Show badge and filter from feeds`;
		}
		return l`Show badge`;
	} else {
		if (pref === 'hide') {
			return l`Filter from feeds`;
		}
		return l`Disabled`;
	}
}
