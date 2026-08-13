import type { ReactNode } from 'react';

import * as TextField from '#/components/TextField';

import { m } from '#/paraglide/messages';

import * as styles from './QuestionField.css';

type Props = {
	answer: string;
	disabled: boolean;
	onAnswer: (text: string) => void;
	question: string;
};

export const QuestionField = ({ answer, disabled, onAnswer, question }: Props): ReactNode => {
	return (
		<TextField.Root>
			<TextField.LabelText>{question}</TextField.LabelText>
			<TextField.Input
				className={styles.input}
				disabled={disabled}
				label={m['view.composer.altText.generate.a11y.answerLabel']()}
				maxRows={6}
				minRows={1}
				multiline
				onChangeText={onAnswer}
				value={answer}
			/>
		</TextField.Root>
	);
};
