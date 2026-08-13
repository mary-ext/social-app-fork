'use no memo'; // compiler output is duplicated across lazy chunks and outweighs these thin wrappers

import type { ReactNode } from 'react';

import { ErrorBoundary as ScionErrorBoundary } from '@oomfware/scion';

import { m } from '#/paraglide/messages';

import * as css from './ErrorBoundary.css';
import { ErrorScreen } from './ErrorScreen';

interface Props {
	children?: ReactNode;
	renderError?: (error: unknown) => ReactNode;
}

export function ErrorBoundary({ children, renderError }: Props) {
	const fallback = (error: unknown) => {
		if (renderError) {
			return renderError(error);
		}

		return (
			<div className={css.fill}>
				<TranslatedErrorScreen details={String(error)} />
			</div>
		);
	};

	return <ScionErrorBoundary fallback={fallback}>{children}</ScionErrorBoundary>;
}

function TranslatedErrorScreen({ details }: { details?: string }) {
	return (
		<ErrorScreen
			title={m['common.error.ohNo']()}
			message={m['common.error.unexpected']()}
			details={details}
		/>
	);
}
