import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';
import { useCallOnce } from '#/lib/once';

import { useSessionApi } from '#/state/session';
import { InactiveAccountError } from '#/state/session/agent';

import { logger } from '#/logger';

import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { atoms as a, useTheme } from '#/alf';

import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function OAuthCallback() {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	const { completeOAuthCallback } = useSessionApi();
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
					logger.error('OAuth callback failed', {
						message: e instanceof Error ? e.message : String(e),
					});
					if (e instanceof InactiveAccountError) {
						Toast.show(m['view.auth.error.accountInactive'](), { type: 'warning' });
					} else {
						setError(m['view.auth.error.signInFailed']());
					}
				});
		});
	}, [runOnce, completeOAuthCallback]);

	return (
		<View
			style={[
				a.util_screen_outer,
				a.align_center,
				a.justify_center,
				a.gap_md,
				t.atoms.bg,
				{ paddingTop: insets.top, paddingBottom: insets.bottom },
			]}
		>
			<ErrorBoundary>
				{error ? (
					<Text style={[a.text_md, t.atoms.text_contrast_high]}>{error}</Text>
				) : (
					<>
						<Loader size="xl" />
						<Text style={[a.text_md, t.atoms.text_contrast_high]}>{m['view.auth.label.signingIn']()}</Text>
					</>
				)}
			</ErrorBoundary>
		</View>
	);
}
