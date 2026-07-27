import { useEffect, useState } from 'react';

import { useCallOnce } from '#/lib/once';

import { completeOAuthCallback } from '#/state/session';
import { InactiveAccountError } from '#/state/session/agent';

import { ErrorBoundary } from '#/components/ErrorBoundary';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import * as css from './OAuthCallback.css';

export function OAuthCallback() {
	const [error, setError] = useState('');
	const runOnce = useCallOnce();

	useEffect(() => {
		runOnce(() => {
			const params = new URLSearchParams(window.location.hash.slice(1));
			history.replaceState(null, '', window.location.pathname);

			completeOAuthCallback(params)
				.then(() => {
					history.replaceState(null, '', '/');
					window.location.reload();
				})
				.catch((e) => {
					console.error('OAuth callback failed', e);
					if (e instanceof InactiveAccountError) {
						Toast.show(m['view.auth.signIn.accountInactiveError'](), { type: 'warning' });
					} else {
						setError(m['view.auth.signIn.failedError']());
					}
				});
		});
	}, [runOnce]);

	return (
		<div className={css.container}>
			<ErrorBoundary>
				{error ? (
					<Text color="textContrastHigh" size="md">
						{error}
					</Text>
				) : (
					<>
						<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
						<Text color="textContrastHigh" size="md">
							{m['view.auth.signIn.inProgress']()}
						</Text>
					</>
				)}
			</ErrorBoundary>
		</div>
	);
}
