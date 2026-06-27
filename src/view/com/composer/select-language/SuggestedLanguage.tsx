import { useEffect, useMemo, useRef, useState } from 'react';
import { Text as RNText, View } from 'react-native';
import { tokenize } from '@atcute/bluesky-richtext-parser';
import debounce from 'lodash.debounce';

import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useNonReactiveObject } from '#/lib/hooks/useNonReactiveObject';
import { type Detection, detectLanguagesAsync } from '#/lib/language-detection';

import { logger } from '#/logger';

import { code3ToCode2, codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';
import { Trans } from '#/locale/Trans';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon } from '#/components/Button';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

/**
 * Extracts the primary language subtag from a BCP-47 language tag (e.g. `en-US` → `en`), or `undefined` if
 * the tag can't be parsed.
 */
function getPrimaryLanguageSubtag(lang: string): string | undefined {
	try {
		return new Intl.Locale(lang).language;
	} catch {
		return undefined;
	}
}

const MIN_TEXT_LENGTH = 20;

/*
 * The detector emits a deliberately flat softmax over ~50 languages, so absolute probability is a weak
 * signal: a clean, unambiguous detection peaks around 0.4–0.65, while pure noise (emoji, numbers, keysmash)
 * stays near 0. Separation discriminates far better than height, so we decide on the margin between the top
 * two candidates rather than an absolute acceptance bar.
 *
 * - top candidate below NUDGE_FLOOR → not enough signal to say anything.
 * - at or above the floor, margin at or above SUGGEST_MARGIN → one clear winner; show the suggestion.
 * - at or above the floor, margin below it → real text the model can't pin down (a confusable pair like
 *   da/nb, or genuinely mixed-language text); nudge instead of asserting.
 *
 * Values are empirically tuned: across a multi-language corpus the margin gate yields no confident-but-wrong
 * suggestions, while the floor keeps confusable Latin clusters (cs/sk, da/no/sv) as nudges rather than silence
 * without letting low-signal noise (emoji, numbers, keysmash) cross it.
 */
const NUDGE_FLOOR = 0.2;
const SUGGEST_MARGIN = 0.2;

type DetectionVerdict =
	| { kind: 'ambiguous'; language: string }
	| { kind: 'confident'; language: string }
	| { kind: 'none' };

export function SuggestedLanguage({
	text,
	replyToLanguages: replyToLanguagesProp,
	currentLanguages,
	onAcceptSuggestedLanguage,
	onNudge,
}: {
	text: string;
	/** All languages associated with the post being replied to. */
	replyToLanguages: string[];
	/** All languages currently selected for the post being composed. */
	currentLanguages: string[];
	/**
	 * Called when the user accepts a suggested language. We only pass a single language here. If the post being
	 * replied to has multiple languages, we only suggest the first one.
	 */
	onAcceptSuggestedLanguage: (language: string | null) => void;
	/**
	 * Fired when detection produced ambiguous results — no strong suggestion to show, but we want to hint to
	 * the user that the detector is unsure. Expected to be an incrementing counter setter on the parent so the
	 * nudge can re-fire on each detection cycle.
	 */
	onNudge?: () => void;
}) {
	const [hasInteracted, setHasInteracted] = useState(false);
	const [suggLang, setSuggLang] = useState<string | undefined>(undefined);
	const declinedSuggLangsRef = useRef<string[]>([]);

	/*
	 * Shared callbacks
	 */
	const onAccept = (language: string) => {
		onAcceptSuggestedLanguage(language);
		// clear
		setSuggLang(undefined);
	};
	const onDecline = (language: string) => {
		declinedSuggLangsRef.current.push(language);
		// clear
		setSuggLang(undefined);
		setHasInteracted(true);
	};

	/** Create non-reactive ref for debounced detection method. */
	const detectionPropsRef = useNonReactiveObject({
		currentLanguages,
	});

	/*
	 * Held in a ref so the debounced detection closure always sees the
	 * latest callback identity without rebuilding the debounce timer.
	 */
	const handleOnNudge = useNonReactiveCallback(onNudge);

	/*
	 * Main language detection effect
	 */
	const detectLanguage = useMemo(() => {
		// lodash.debounce stores this callback without invoking it, so detectionPropsRef.current is read
		// only when the debounced function fires from the effect below, never during render.
		// eslint-disable-next-line react-hooks/refs
		return debounce(async (text: string) => {
			try {
				const currLangs = detectionPropsRef.current.currentLanguages;
				const verdict = classifyDetection(await detectLanguagesAsync(text));
				switch (verdict.kind) {
					case 'confident': {
						// one clear winner — show the suggestion, unless it's already selected or was declined
						const fresh =
							!currLangs.includes(verdict.language) &&
							!declinedSuggLangsRef.current.includes(verdict.language);
						setSuggLang(fresh ? verdict.language : undefined);
						break;
					}
					case 'ambiguous': {
						// real text the model can't pin down — hint via the button pulse rather than asserting a language
						if (
							!currLangs.includes(verdict.language) &&
							!declinedSuggLangsRef.current.includes(verdict.language)
						) {
							handleOnNudge();
						}
						setSuggLang(undefined);
						break;
					}
					case 'none': {
						setSuggLang(undefined);
						break;
					}
				}
			} catch (e) {
				logger.error('Error detecting language', { safeMessage: e });
			}
		}, 500);
		// empty deps are intentional: the debounce timer is built once and reads the latest state via
		// detectionPropsRef / handleOnNudge (a useNonReactiveCallback) rather than closing over it.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// latch interacted-once as soon as there's any text. render-time adjustment so we don't setState
	// synchronously inside the effect below (which would trip set-state-in-effect).
	if (text.length > 0 && !hasInteracted) {
		setHasInteracted(true);
	}

	// when text drops below the min length, clear any suggestion during render (no detect run on small
	// posts — results would be inaccurate).
	const textTrimmed = sanitizeTextForDetection(text);
	if (textTrimmed.length < MIN_TEXT_LENGTH && suggLang !== undefined) {
		setSuggLang(undefined);
	}

	useEffect(() => {
		// no language model run on small posts; see the render-time clear above.
		if (textTrimmed.length < MIN_TEXT_LENGTH) {
			return;
		}

		void detectLanguage(textTrimmed);

		// Cancel any pending debounced invocation on unmount / re-run so we
		// don't call setSuggLang after the composer has closed (or after the
		// user has already accepted a language).
		return () => {
			detectLanguage.cancel();
		};
	}, [textTrimmed, detectLanguage]);

	/*
	 * We've detected a language, and the user hasn't already selected it.
	 * Note: suggLang is only set if it's not in declinedSuggLangsRef (checked
	 * in detectLanguage), so we don't need to filter it here.
	 */
	const hasLanguageSuggestion = suggLang && !currentLanguages.includes(suggLang);

	/*
	 * We have not detected a different language, and the user is not already
	 * using or has not already selected one of the languages of the post they
	 * are replying to.
	 */
	const replyToLanguages = replyToLanguagesProp
		.filter(Boolean)
		.map((lang) => getPrimaryLanguageSubtag(lang))
		.filter(Boolean) as string[];
	const [replyToLanguage] = replyToLanguages;
	const hasSuggestedReplyLanguage =
		!hasInteracted && !suggLang && replyToLanguage && !currentLanguages.includes(replyToLanguage);

	if (hasLanguageSuggestion) {
		return <GuessedLanguage language={suggLang} onAccept={onAccept} onDecline={() => onDecline(suggLang)} />;
	} else if (hasSuggestedReplyLanguage) {
		return (
			<ReplyLanguageNudge
				language={replyToLanguage}
				onAccept={onAccept}
				onDecline={() => onDecline(replyToLanguage)}
			/>
		);
	} else {
		return null;
	}
}

function GuessedLanguage({
	language,
	onAccept: onAcceptOuter,
	onDecline: onDeclineOuter,
}: {
	language: string;
	onAccept: (language: string) => void;
	onDecline: () => void;
}) {
	const suggestedLanguageName = codeToLanguageName(language, LOCALE);
	const onAccept = () => {
		onAcceptOuter(language);
	};
	const onDecline = () => {
		onDeclineOuter();
	};

	return (
		<LanguageSuggestionButton
			label={
				<RNText>
					<Trans
						message={m['view.composer.language.prompt']}
						inputs={{ suggestedLanguageName }}
						markup={{ t0: ({ children }) => <Text style={[a.font_semi_bold]}>{children}</Text> }}
					/>
				</RNText>
			}
			value={language}
			onAccept={onAccept}
			onDecline={onDecline}
		/>
	);
}

function ReplyLanguageNudge({
	language,
	onAccept: onAcceptOuter,
	onDecline: onDeclineOuter,
}: {
	language: string;
	onAccept: (language: string) => void;
	onDecline: () => void;
}) {
	const suggestedLanguageName = codeToLanguageName(language, LOCALE);
	const onAccept = () => {
		onAcceptOuter(language);
	};
	const onDecline = () => {
		onDeclineOuter();
	};

	return (
		<LanguageSuggestionButton
			label={
				<RNText>
					<Trans
						message={m['view.composer.language.replyPrompt']}
						inputs={{ suggestedLanguageName }}
						markup={{ t0: ({ children }) => <Text style={[a.font_semi_bold]}>{children}</Text> }}
					/>
				</RNText>
			}
			value={language}
			onAccept={onAccept}
			onDecline={onDecline}
		/>
	);
}

function LanguageSuggestionButton({
	label,
	value,
	onAccept,
	onDecline,
}: {
	label: React.ReactNode;
	value: string;
	onAccept: (language: string | null) => void;
	onDecline: () => void;
}) {
	const t = useTheme();

	return (
		<View style={[a.px_lg, a.py_sm]}>
			<View
				style={[
					a.gap_md,
					a.border,
					a.flex_row,
					a.align_center,
					a.rounded_sm,
					a.p_md,
					a.pl_lg,
					t.atoms.bg,
					t.atoms.border_contrast_low,
				]}
			>
				<EarthIcon />
				<View style={[a.flex_1]}>
					<Text
						style={[
							a.leading_snug,
							{
								maxWidth: 400,
							},
						]}
					>
						{label}
					</Text>
				</View>

				<Button
					size="small"
					color="primary_subtle"
					shape="round"
					onPress={() => onAccept(value)}
					label={m['view.composer.language.a11y.acceptSuggestion']()}
				>
					<ButtonIcon icon={CheckIcon} size="sm" />
				</Button>

				<Button
					size="small"
					color="secondary"
					shape="round"
					onPress={() => onDecline()}
					label={m['view.composer.language.a11y.declineSuggestion']()}
				>
					<ButtonIcon icon={XIcon} size="sm" />
				</Button>
			</View>
		</View>
	);
}

/**
 * Classify a probability-sorted detection list into a suggestion verdict, deciding on the margin between the
 * top two candidates rather than absolute probability — see {@link NUDGE_FLOOR} / {@link SUGGEST_MARGIN}.
 *
 * @param detections probability-sorted detections from the model (ISO 639-3 codes)
 * @returns `confident` with a single clear winner, `ambiguous` when there's signal but no winner, or `none`
 *   when the text is too low-signal to say anything
 */
function classifyDetection(detections: Detection[]): DetectionVerdict {
	const top = detections[0];
	if (!top || top[1] < NUDGE_FLOOR) {
		return { kind: 'none' };
	}

	// the model emits ISO 639-3 codes; the rest of the suggestion pipeline works in 2-letter subtags
	const language = code3ToCode2(top[0]);
	const margin = top[1] - (detections[1]?.[1] ?? 0);
	return margin >= SUGGEST_MARGIN ? { kind: 'confident', language } : { kind: 'ambiguous', language };
}

/**
 * Strip any detected facets from the text to improve language detection accuracy. For example, URLs and
 * mentions.
 *
 * Tags are intentionally kept — their word content is usually in the post's language and helps detection; the
 * leading `#` is short enough not to distort results.
 */
function sanitizeTextForDetection(text: string): string {
	let sanitized = '';
	for (const token of tokenize(text.trim())) {
		switch (token.type) {
			case 'mention':
			case 'autolink':
			case 'link':
				// Drop links and mentions — they aren't in the post's language.
				break;
			case 'topic':
				// Keep the hashtag's word content (the leading `#` is dropped).
				sanitized += token.name;
				break;
			case 'text':
				sanitized += token.content;
				break;
			default:
				sanitized += token.raw;
		}
	}
	return sanitized.trim();
}
