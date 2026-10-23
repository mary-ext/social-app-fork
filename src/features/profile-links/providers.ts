import { parseLooseUrl, safeUrlParse } from '#/lib/utils/url';

/** logo asset name; resolved by ProviderLogo to keep this module free of asset imports. */
export type SupportProviderLogoName =
	| 'BigCartel'
	| 'Boosty'
	| 'BuyMeACoffee'
	| 'CashApp'
	| 'Chuffed'
	| 'Crowdfundr'
	| 'Donorbox'
	| 'Etsy'
	| 'Fourthwall'
	| 'Givebutter'
	| 'GoFundMe'
	| 'Gumroad'
	| 'Indiegogo'
	| 'Inprint'
	| 'ItchIo'
	| 'JustGiving'
	| 'Kickstarter'
	| 'KoFi'
	| 'Liberapay'
	| 'OpenCollective'
	| 'Patreon'
	| 'PayPal'
	| 'Redbubble'
	| 'Stripe'
	| 'Substack'
	| 'Throne'
	| 'Venmo'
	| 'Vgen'
	| 'Zeffy';

export type SupportProvider = {
	name: string;
	logo: SupportProviderLogoName;
	/** domain or host to match, including subdomains. */
	domain: string;
	/** for providers that share a domain with non-support pages. */
	pathPrefix?: string;
};

/** creator-support platforms whose links get the green support pill. */
export const SUPPORT_PROVIDERS: SupportProvider[] = [
	{ name: 'Big Cartel', logo: 'BigCartel', domain: 'bigcartel.com' },
	{ name: 'Boosty', logo: 'Boosty', domain: 'boosty.to' },
	{ name: 'Buy Me a Coffee', logo: 'BuyMeACoffee', domain: 'buymeacoffee.com' },
	{ name: 'Cash App', logo: 'CashApp', domain: 'cash.app' },
	{ name: 'Chuffed', logo: 'Chuffed', domain: 'chuffed.org', pathPrefix: '/campaign/' },
	{ name: 'Chuffed', logo: 'Chuffed', domain: 'chuffed.org', pathPrefix: '/project/' },
	{ name: 'Crowdfundr', logo: 'Crowdfundr', domain: 'crowdfundr.com' },
	{ name: 'Donorbox', logo: 'Donorbox', domain: 'donorbox.org' },
	{ name: 'Etsy', logo: 'Etsy', domain: 'etsy.com' },
	{ name: 'Fourthwall', logo: 'Fourthwall', domain: 'fourthwall.com' },
	{ name: 'Givebutter', logo: 'Givebutter', domain: 'givebutter.com' },
	{ name: 'GoFundMe', logo: 'GoFundMe', domain: 'gofundme.com' },
	{ name: 'Gumroad', logo: 'Gumroad', domain: 'gumroad.com' },
	{ name: 'Indiegogo', logo: 'Indiegogo', domain: 'indiegogo.com' },
	{ name: 'INPRNT', logo: 'Inprint', domain: 'inprnt.com', pathPrefix: '/gallery/' },
	{ name: 'itch.io', logo: 'ItchIo', domain: 'itch.io' },
	{ name: 'JustGiving', logo: 'JustGiving', domain: 'justgiving.com' },
	{ name: 'Kickstarter', logo: 'Kickstarter', domain: 'kickstarter.com' },
	{ name: 'Ko-fi', logo: 'KoFi', domain: 'ko-fi.com' },
	{ name: 'Liberapay', logo: 'Liberapay', domain: 'liberapay.com' },
	{ name: 'Open Collective', logo: 'OpenCollective', domain: 'opencollective.com' },
	{ name: 'Patreon', logo: 'Patreon', domain: 'patreon.com' },
	{ name: 'PayPal', logo: 'PayPal', domain: 'paypal.com', pathPrefix: '/paypalme/' },
	{ name: 'PayPal', logo: 'PayPal', domain: 'paypal.me' },
	{ name: 'Redbubble', logo: 'Redbubble', domain: 'redbubble.com' },
	{ name: 'Stripe', logo: 'Stripe', domain: 'buy.stripe.com' },
	{ name: 'Stripe', logo: 'Stripe', domain: 'donate.stripe.com' },
	{ name: 'Substack', logo: 'Substack', domain: 'substack.com' },
	{ name: 'Throne', logo: 'Throne', domain: 'throne.com' },
	{ name: 'Venmo', logo: 'Venmo', domain: 'venmo.com' },
	{ name: 'VGen', logo: 'Vgen', domain: 'vgen.co' },
	{ name: 'Zeffy', logo: 'Zeffy', domain: 'zeffy.com' },
];

const hostMatchesDomain = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

// account pages use a subdomain or path; exclude bare and www homepages.
const isAccountUrl = (url: URL, provider: SupportProvider): boolean => {
	const host = url.hostname.toLowerCase();
	const path = url.pathname.toLowerCase().replace(/\/+$/, '');
	if (provider.pathPrefix) {
		return path.startsWith(`${provider.pathPrefix.replace(/\/+$/, '')}/`);
	}
	return (host !== provider.domain && host !== `www.${provider.domain}`) || path.length > 0;
};

/**
 * normalizes a typed link like `patreon.com/name` into a full URL.
 *
 * @param input user-entered URL
 * @returns the URL, or null if it isn't a usable web link
 */
export const normalizeProfileLinkUrl = (input: string): string | null => parseLooseUrl(input);

/**
 * finds the support platform a link points to. a bare provider homepage never counts.
 *
 * @param url the link's URL
 * @returns the provider, if any
 */
export const getSupportProvider = (url: string): SupportProvider | undefined => {
	const parsed = safeUrlParse(url);
	if (!parsed) {
		return undefined;
	}
	const host = parsed.hostname.toLowerCase();
	return SUPPORT_PROVIDERS.find(
		(provider) => hostMatchesDomain(host, provider.domain) && isAccountUrl(parsed, provider),
	);
};

/**
 * @param url the link's URL
 * @returns the URL without an HTTP(S) scheme, leading www, or trailing slash
 */
export const formatLinkUrl = (url: string): string => {
	return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
};

/**
 * @param url the link's URL
 * @returns the bare host, or the input if it doesn't parse
 */
export const getLinkHost = (url: string): string => {
	const parsed = safeUrlParse(url);
	return parsed ? parsed.hostname.replace(/^www\./, '') : url;
};

export type LinkInputValidation = {
	/** the full URL, or null if the input isn't a usable link. */
	url: string | null;
	provider: SupportProvider | undefined;
	isEmpty: boolean;
};

/**
 * @param input the field's value
 * @returns the normalized URL, matching provider, and whether the input is blank
 */
export const validateLinkInput = (input: string): LinkInputValidation => {
	const trimmed = input.trim();
	const url = trimmed ? normalizeProfileLinkUrl(trimmed) : null;
	return {
		url,
		provider: url ? getSupportProvider(url) : undefined,
		isEmpty: trimmed.length === 0,
	};
};
