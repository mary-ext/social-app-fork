export type TapperFacetConfig = Record<string, RegExp>;

export type TapperNode =
	| {
			id: number;
			type: 'text';
			raw: string;
			value: string;
			start: number;
			end: number;
			committed?: boolean;
			facetType?: undefined;
	  }
	| {
			id: number;
			type: 'trigger';
			raw: string;
			value: string;
			start: number;
			end: number;
			committed?: boolean;
			facetType: string;
	  }
	| {
			id: number;
			type: 'facet';
			raw: string;
			value: string;
			start: number;
			end: number;
			committed?: boolean;
			facetType: string;
	  };

export type TapperFacet = {
	type: string;
	raw: string;
	value: string;
	range: { start: number; end: number };
};

export type TapperActiveFacet = TapperFacet & {
	replace: (value: string, options?: { noTrailingSpace?: boolean }) => void;
};

export type TapperSelection = { start: number; end: number };

export type TapperSnapshot = {
	text: string;
	selection: TapperSelection;
	nodes: TapperNode[];
	activeFacet: TapperActiveFacet | null;
};

export type TapperConfig = {
	facets?: TapperFacetConfig;
	initialText?: string;
};

export type TapperEvents = {
	activeFacet: TapperActiveFacet | null;
	facetCommitted: TapperFacet;
	afterInsert: TapperFacet;
};
