import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { logger } from '#/logger';

import { m } from '#/paraglide/messages';

import { ErrorScreen } from './error/ErrorScreen';
import { CenteredView } from './Views';

interface Props {
	children?: ReactNode;
	renderError?: (error: unknown) => ReactNode;
	style?: StyleProp<ViewStyle>;
}

interface State {
	hasError: boolean;
	error: unknown;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: undefined,
	};

	public static getDerivedStateFromError(error: unknown): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		logger.error(error, { errorInfo });
	}

	public render() {
		if (this.state.hasError) {
			if (this.props.renderError) {
				return this.props.renderError(this.state.error);
			}

			return (
				<CenteredView style={[{ height: '100%', flex: 1 }, this.props.style]}>
					<TranslatedErrorScreen details={String(this.state.error)} />
				</CenteredView>
			);
		}

		return this.props.children;
	}
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
