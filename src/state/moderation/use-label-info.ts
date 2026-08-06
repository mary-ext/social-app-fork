import type { ComAtprotoLabelDefs } from '@atcute/atproto';
import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import {
	BUILTIN_LABELS,
	type InterpretedLabelDefinition,
	type InterpretedLabelMapping,
	interpretLabelValueDefinition,
	type LabelLocale,
} from '@atcute/bluesky-moderation';

import { getGlobalLabelStrings } from '#/state/moderation/global-label-strings';
import { useLabelDefinitions } from '#/state/moderation/label-defs';

import { matchesLanguage } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

interface LabelInfo {
	label: ComAtprotoLabelDefs.Label;
	def: InterpretedLabelDefinition;
	strings: LabelLocale;
	labeler: AppBskyLabelerDefs.LabelerViewDetailed | undefined;
}

export function useLabelInfo(label: ComAtprotoLabelDefs.Label): LabelInfo {
	const { labelDefs, labelers } = useLabelDefinitions();
	const def = getDefinition(labelDefs, label);
	return {
		label,
		def,
		strings: getLabelStrings(LOCALE, def),
		labeler: labelers.find((labeler) => label.src === labeler.creator.did),
	};
}

export function getDefinition(
	labelDefs: Record<string, InterpretedLabelMapping | undefined>,
	label: ComAtprotoLabelDefs.Label,
): InterpretedLabelDefinition {
	// check labeler-defined definitions (custom labels only; `!`-prefixed labels are always global)
	if (!label.val.startsWith('!')) {
		const customDef = labelDefs[label.src]?.[label.val];
		if (customDef) {
			return customDef;
		}
	}

	// check global definitions
	const globalDef = BUILTIN_LABELS[label.val];
	if (globalDef) {
		return globalDef;
	}

	// fallback to a noop definition
	return interpretLabelValueDefinition({
		blurs: 'none',
		defaultSetting: 'ignore',
		identifier: label.val,
		locales: [],
		severity: 'none',
	});
}

export function getLabelStrings(locale: string, def: InterpretedLabelDefinition): LabelLocale {
	// global/builtin labels carry their localized strings in the app, keyed by identifier
	const globalStrings = getGlobalLabelStrings(def.identifier);
	if (globalStrings) {
		return { lang: locale, name: globalStrings.name, description: globalStrings.description };
	}
	// custom labels: try to find a locale match in the definition's own strings
	const localeMatch = def.locales.find((strings) => matchesLanguage(locale, strings.lang));
	if (localeMatch) {
		return localeMatch;
	}
	// fall back to the zero item if no match
	if (def.locales[0]) {
		return def.locales[0];
	}
	return {
		lang: locale,
		name: def.identifier,
		description: `Labeled "${def.identifier}"`,
	};
}
