'use no memo'; // generated cache cost outweighs reuse in these shallow renderers

import type { ReactNode } from 'react';

import { ErrorBoundary as ScionErrorBoundary } from '@oomfware/scion';

import * as css from './ErrorBoundary.css';
import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';

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
				<ErrorBoundaryFallback details={String(error)} />
			</div>
		);
	};

	return <ScionErrorBoundary fallback={fallback}>{children}</ScionErrorBoundary>;
}
