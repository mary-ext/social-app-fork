declare module 'psl' {
	export type ParsedDomain = {
		domain: string | null;
		error?: undefined;
		input: string;
		listed: boolean;
		sld: string | null;
		subdomain: string | null;
		tld: string | null;
	};

	export type ParseError = {
		domain?: undefined;
		error: {
			code: string;
			message: string;
		};
		input: string;
		listed?: undefined;
	};

	export function parse(input: string): ParsedDomain | ParseError;
}
