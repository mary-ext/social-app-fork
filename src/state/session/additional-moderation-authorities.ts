import type { Did } from '@atcute/lexicons';

import { unique } from '@mary/array-fns';

import { configureAppLabelers, getAppLabelers } from '#/lib/moderation/app-labelers';

import { logger } from '#/logger';

export function isNonConfigurableModerationAuthority(_did: string) {
	return false;
}

export function configureAdditionalModerationAuthorities() {
	const additionalLabelers: Did[] = [];

	const appLabelers = unique([...getAppLabelers(), ...additionalLabelers]);

	logger.info(`applying mod authorities`, {
		additionalLabelers,
		appLabelers,
	});

	configureAppLabelers(appLabelers);
}
