import { useEffect, useEffectEvent } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { getPostRecord } from '#/lib/api/record-casts';

import { usePostTranslation } from '#/state/queries/post-translation';
import { useSession } from '#/state/session';

import { codeToLanguageName, isPostInLanguage } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import { InlineButton } from '#/components/web/Link';

import ArrowRightIcon from '#/icons/central/ArrowRight_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './Translated.css';

type Props = {
	post: AppBskyFeedDefs.PostView;
	onHide: () => void;
	onShow: () => void;
	shown: boolean;
	textSize: 'lg' | 'md';
};

/**
 * renders translation controls for a post.
 *
 * @param props post and display options
 * @returns translation controls, or `null` when translation is unavailable
 */
export const TranslatedPost = ({ post, onHide, onShow, shown, textSize }: Props): React.ReactNode => {
	const { hasSession } = useSession();

	if (!hasSession || getPostRecord(post).text === '') {
		return null;
	}

	return (
		<TranslatedPostInner post={post} onHide={onHide} onShow={onShow} shown={shown} textSize={textSize} />
	);
};

const TranslatedPostInner = ({ post, onHide, onShow, shown, textSize }: Props): React.ReactNode => {
	const { state, targetLanguage, translate } = usePostTranslation(post);
	const startTranslation = useEffectEvent(translate);

	useEffect(() => {
		if (shown && state.status === 'idle') {
			startTranslation();
		}
	}, [shown, state.status]);

	if (!shown) {
		if (isPostInLanguage(post, [targetLanguage])) {
			return null;
		}

		return (
			<InlineButton className={css.link} onClick={onShow} size="sm">
				{m['components.post.translate.action.translate']()}
			</InlineButton>
		);
	}

	switch (state.status) {
		case 'error': {
			return (
				<div className={css.box}>
					<div className={css.header}>
						<WarningIcon className={css.warningIcon} />
						<div className={css.headerText}>
							<Text color="textContrastHigh" leading="snug" size="xs">
								{state.message}
							</Text>
						</div>
						<DismissButton onClick={onHide} />
					</div>
					<InlineButton className={css.boxLink} onClick={translate} size="sm">
						{m['common.action.tryAgain']()}
					</InlineButton>
				</div>
			);
		}
		case 'success': {
			return (
				<div className={css.box}>
					<div className={css.header}>
						<div className={css.headerText}>
							<LanguagePair source={state.sourceLanguage} target={targetLanguage} />
						</div>
						<DismissButton onClick={onHide} />
					</div>
					<Text leading="snug" selectable size={textSize}>
						{state.translation}
					</Text>
				</div>
			);
		}
		default: {
			return (
				<div className={css.status}>
					<Text color="textContrastMedium" size="sm">
						{m['components.post.translate.status.translating']()}
					</Text>
					<Spinner color="default" label={null} size="xs" />
				</div>
			);
		}
	}
};

const LanguagePair = ({
	source,
	target,
}: {
	source: string | undefined;
	target: string;
}): React.ReactNode => {
	if (source === undefined) {
		return (
			<Text color="textContrastMedium" leading="snug" size="xs">
				{m['components.post.translate.translated']()}
			</Text>
		);
	}

	return (
		<>
			<Text color="textContrastMedium" leading="snug" size="xs">
				{codeToLanguageName(source, LOCALE)}
			</Text>
			<ArrowRightIcon className={css.arrowIcon} />
			<Text color="textContrastMedium" leading="snug" size="xs">
				{codeToLanguageName(target, LOCALE)}
			</Text>
		</>
	);
};

const DismissButton = ({ onClick }: { onClick: () => void }): React.ReactNode => {
	return (
		<Button
			className={css.dismiss}
			color="secondary"
			label={m['components.post.translate.action.hide']()}
			onClick={onClick}
			shape="round"
			size="tiny"
			variant="ghost"
		>
			<ButtonIcon icon={XIcon} />
		</Button>
	);
};
