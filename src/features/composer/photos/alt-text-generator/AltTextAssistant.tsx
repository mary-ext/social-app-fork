import { Sparkle_Filled_Corner0_Rounded as SparkleIcon } from '#/components/icons/Sparkle';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import TimesIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as styles from './AltTextAssistant.css';
import { QuestionField } from './QuestionField';
import type { Generator } from './use-generator';

const Action = ({ generator }: { generator: Generator }): React.ReactNode => {
	const { answeredCount, hasEdits, phase } = generator;

	switch (phase) {
		case 'error': {
			return (
				<Button
					className={styles.action}
					color="primary"
					label={m['common.action.tryAgain']()}
					onClick={generator.generate}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.tryAgain']()}</ButtonText>
				</Button>
			);
		}
		case 'idle': {
			return (
				<Button
					className={styles.action}
					color="primary"
					label={m['view.composer.altText.generate.action.generate']()}
					onClick={generator.generate}
					size="large"
					variant="solid"
				>
					<ButtonIcon icon={SparkleIcon} />
					<ButtonText>{m['view.composer.altText.generate.action.generate']()}</ButtonText>
				</Button>
			);
		}
		case 'review': {
			const label =
				answeredCount > 0
					? m['view.composer.altText.generate.action.withAnswers']({ answered: answeredCount })
					: m['view.composer.altText.generate.action.rewrite']();

			return (
				<Button
					className={styles.action}
					color="primary"
					label={label}
					onClick={generator.generate}
					size="large"
					variant={answeredCount > 0 || hasEdits ? 'solid' : 'outline'}
				>
					<ButtonIcon icon={SparkleIcon} />
					<ButtonText>{label}</ButtonText>
				</Button>
			);
		}
		case 'thinking': {
			return (
				<Button
					className={styles.action}
					color="secondary"
					label={m['view.composer.altText.generate.action.stop']()}
					onClick={generator.cancel}
					size="large"
					variant="outline"
				>
					<ButtonText>{m['view.composer.altText.generate.action.stop']()}</ButtonText>
				</Button>
			);
		}
	}
};

type Props = {
	generator: Generator;
};

export const AltTextAssistant = ({ generator }: Props): React.ReactNode => {
	const { additionalContext, draft, error, hasEdits, phase, questions } = generator;
	const isThinking = phase === 'thinking';

	return (
		<section className={styles.panel}>
			<div className={styles.header}>
				<SparkleIcon fill={colors.primary_500} size="sm" />
				<Text className={styles.headerText} size="md" weight="semiBold">
					{m['view.composer.altText.generate.title']()}
				</Text>
				{phase !== 'idle' && (
					<Button
						className={styles.dismiss}
						color="secondary"
						label={m['view.composer.altText.generate.action.dismiss']()}
						onClick={generator.dismiss}
						shape="round"
						size="tiny"
						variant="ghost"
					>
						<ButtonIcon icon={TimesIcon} />
					</Button>
				)}
			</div>

			{phase === 'idle' && (
				<Text color="textContrastMedium" size="md_sub">
					{m['view.composer.altText.generate.intro']()}
				</Text>
			)}

			{isThinking && (
				<div className={styles.row} role="status">
					<Spinner color="default" label={null} size="md" />
					<Text className={styles.rowText} color="textContrastMedium" size="md_sub">
						{draft === null
							? m['view.composer.altText.generate.status.starting']()
							: m['view.composer.altText.generate.status.refining']()}
					</Text>
				</div>
			)}

			{phase === 'error' && (
				<div className={styles.errorBox}>
					<Text color="negative_600" size="md_sub" weight="semiBold">
						{m['view.composer.altText.generate.error.title']()}
					</Text>
					{error !== null && (
						<Text color="negative_600" size="md_sub">
							{error}
						</Text>
					)}
				</div>
			)}

			{draft !== null && (
				<div className={styles.questionList}>
					{questions.map(({ answer, question }) => (
						<QuestionField
							key={question}
							answer={answer ?? ''}
							disabled={isThinking}
							onAnswer={(next) => generator.setAnswer(question, next)}
							question={question}
						/>
					))}
					{/* standing offer: the model runs out of questions long before the user runs out of things to say */}
					<QuestionField
						answer={additionalContext}
						disabled={isThinking}
						onAnswer={generator.setAdditionalContext}
						question={m['view.composer.altText.generate.questions.anythingElse']()}
					/>
				</div>
			)}

			{hasEdits && !isThinking && (
				<Text color="textContrastMedium" size="md_sub">
					{m['view.composer.altText.generate.editsKept']()}
				</Text>
			)}

			{draft !== null && (
				<Text color="textContrastLow" size="sm">
					{m['view.composer.altText.generate.caution']()}
				</Text>
			)}

			<Action generator={generator} />
		</section>
	);
};
