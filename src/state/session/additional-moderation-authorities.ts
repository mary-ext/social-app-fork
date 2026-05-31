import { configureAppLabelers, getAppLabelers } from '#/lib/moderation/app-labelers';

import { logger } from '#/logger';

export function isNonConfigurableModerationAuthority(_did: string) {
	return false;
}

export function configureAdditionalModerationAuthorities() {
	const additionalLabelers: string[] = [];

	const appLabelers = Array.from(new Set([...getAppLabelers(), ...additionalLabelers]));

	logger.info(`applying mod authorities`, {
		additionalLabelers,
		appLabelers,
	});

	configureAppLabelers(appLabelers);
}
