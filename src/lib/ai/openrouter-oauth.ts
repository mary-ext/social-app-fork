import { toBase64Url } from '@atcute/multibase';
import { encodeUtf8, randomBytes, toSha256 } from '@atcute/uint8array';

import * as v from 'valibot';

import { OpenRouterError } from '#/lib/ai/openrouter-error';
import { openRouterErrorSchema } from '#/lib/ai/openrouter-response';

import { getRouter } from '#/router';

const AUTH_URL = 'https://openrouter.ai/auth';
const KEY_EXCHANGE_URL = 'https://openrouter.ai/api/v1/auth/keys';

const VERIFIER_KEY = 'openrouterCodeVerifier';

const keySchema = v.object({
	key: v.string(),
});

const createChallenge = async (verifier: string): Promise<string> => {
	return toBase64Url(await toSha256(encodeUtf8(verifier)));
};

/** starts OpenRouter PKCE authorization. */
export const startOpenRouterOAuth = async (): Promise<void> => {
	const verifier = toBase64Url(randomBytes(32));
	const challenge = await createChallenge(verifier);

	sessionStorage.setItem(VERIFIER_KEY, verifier);

	const params = new URLSearchParams({
		callback_url: new URL(getRouter().href({ name: 'AiSettings' }), location.origin).href,
		code_challenge: challenge,
		code_challenge_method: 'S256',
	});

	window.location.assign(`${AUTH_URL}?${params}`);
};

/**
 * exchanges an OpenRouter authorization code.
 *
 * @param code authorization code
 * @returns an API key
 * @throws {OpenRouterError} if no verifier exists or the exchange fails
 */
export const exchangeOpenRouterCode = async (code: string): Promise<string> => {
	const verifier = sessionStorage.getItem(VERIFIER_KEY);
	if (verifier === null) {
		throw new OpenRouterError('no OpenRouter sign-in was started in this tab');
	}

	sessionStorage.removeItem(VERIFIER_KEY);

	let response: Response;
	try {
		response = await fetch(KEY_EXCHANGE_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				code: code,
				code_verifier: verifier,
				code_challenge_method: 'S256',
			}),
		});
	} catch (error: unknown) {
		throw new OpenRouterError('could not reach OpenRouter', { cause: error });
	}

	const body: unknown = await response.json().catch(() => undefined);

	if (!response.ok) {
		const failure = v.safeParse(openRouterErrorSchema, body);
		const detail = failure.success ? failure.output.error.message : undefined;
		throw new OpenRouterError(detail ?? `OpenRouter returned ${response.status}`, {
			status: response.status,
		});
	}

	const parsed = v.safeParse(keySchema, body);
	if (!parsed.success) {
		throw new OpenRouterError('OpenRouter returned a reply in an unexpected shape');
	}

	return parsed.output.key;
};
