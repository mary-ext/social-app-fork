import { useEffect, useMemo, useRef, useState } from 'react';

import { tokenize } from '@atcute/bluesky-richtext-parser';

import debounce from 'lodash.debounce';

import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { type Detection, detectLanguagesAsync } from '#/lib/language-detection';

import { logger } from '#/logger';

import { code3ToCode2, codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';
import { Trans } from '#/locale/Trans';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './SuggestedLanguage.css';

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
	 * callback triggered when the user accepts a suggested language
	 *
	 * @param language the accepted language
	 */
	onAcceptSuggestedLanguage: (language: string | null) => void;
	/**
	 * fired when detection produces ambiguous results, hinting to the user that the detector is unsure.
	 * expected to be an incrementing counter setter on the parent so the nudge can re-fire on each detection
	 * cycle.
	 */
	onNudge?: () => void;
}) {
	const [hasInteracted, setHasInteracted] = useState(false);
	const [suggLang, setSuggLang] = useState<string | undefined>(undefined);
	const declinedSuggLangsRef = useRef<string[]>([]);

	const onAccept = (language: string) => {
		onAcceptSuggestedLanguage(language);
		setSuggLang(undefined);
	};
	const onDecline = (language: string) => {
		declinedSuggLangsRef.current.push(language);
		setSuggLang(undefined);
		setHasInteracted(true);
	};

	const detect = useNonReactiveCallback(async (text: string) => {
		try {
			const verdict = classifyDetection(await detectLanguagesAsync(text));
			switch (verdict.kind) {
				case 'confident': {
					const fresh =
						!currentLanguages.includes(verdict.language) &&
						!declinedSuggLangsRef.current.includes(verdict.language);
					setSuggLang(fresh ? verdict.language : undefined);
					break;
				}
				case 'ambiguous': {
					if (
						!currentLanguages.includes(verdict.language) &&
						!declinedSuggLangsRef.current.includes(verdict.language)
					) {
						onNudge?.();
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
	});

	const detectLanguage = useMemo(() => debounce(detect, 500), [detect]);

	if (text.length > 0 && !hasInteracted) {
		setHasInteracted(true);
	}

	const textTrimmed = sanitizeTextForDetection(text);
	if (textTrimmed.length < MIN_TEXT_LENGTH && suggLang !== undefined) {
		setSuggLang(undefined);
	}

	useEffect(() => {
		if (textTrimmed.length < MIN_TEXT_LENGTH) {
			return;
		}

		void detectLanguage(textTrimmed);

		return () => {
			detectLanguage.cancel();
		};
	}, [textTrimmed, detectLanguage]);

	const hasLanguageSuggestion = suggLang && !currentLanguages.includes(suggLang);

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
				<Text>
					<Trans
						message={m['view.composer.language.prompt']}
						inputs={{ language: suggestedLanguageName }}
						markup={{ t0: ({ children }) => <Text weight="semiBold">{children}</Text> }}
					/>
				</Text>
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
				<Text>
					<Trans
						message={m['view.composer.language.replyPrompt']}
						inputs={{ language: suggestedLanguageName }}
						markup={{ t0: ({ children }) => <Text weight="semiBold">{children}</Text> }}
					/>
				</Text>
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
	return (
		<div className={styles.outer}>
			<div className={styles.inner}>
				<EarthIcon className={styles.icon} />

				<Text className={styles.text}>{label}</Text>

				<Button
					className={styles.button}
					size="small"
					color="primary_subtle"
					shape="round"
					onClick={() => onAccept(value)}
					label={m['view.composer.language.a11y.acceptSuggestion']()}
				>
					<ButtonIcon icon={CheckIcon} size="sm" />
				</Button>

				<Button
					className={styles.button}
					size="small"
					color="secondary"
					shape="round"
					onClick={() => onDecline()}
					label={m['view.composer.language.a11y.declineSuggestion']()}
				>
					<ButtonIcon icon={XIcon} size="sm" />
				</Button>
			</div>
		</div>
	);
}

function classifyDetection(detections: Detection[]): DetectionVerdict {
	const top = detections[0];
	if (!top || top[1] < NUDGE_FLOOR) {
		return { kind: 'none' };
	}

	const language = code3ToCode2(top[0]);
	const margin = top[1] - (detections[1]?.[1] ?? 0);
	return margin >= SUGGEST_MARGIN ? { kind: 'confident', language } : { kind: 'ambiguous', language };
}

function sanitizeTextForDetection(text: string): string {
	let sanitized = '';
	for (const token of tokenize(text.trim())) {
		switch (token.type) {
			case 'mention':
			case 'autolink':
			case 'link':
				break;
			case 'topic':
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
