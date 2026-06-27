import { useMemo } from 'react';

import { m } from '#/paraglide/messages';

export const interests = [
	'animals',
	'art',
	'books',
	'comedy',
	'comics',
	'culture',
	'dev',
	'education',
	'finance',
	'food',
	'gaming',
	'journalism',
	'movies',
	'music',
	'nature',
	'news',
	'pets',
	'photography',
	'politics',
	'science',
	'sports',
	'tech',
	'tv',
	'writers',
] as const;
export type Interest = (typeof interests)[number];

// most popular selected interests
export const popularInterests = [
	'art',
	'gaming',
	'sports',
	'comics',
	'music',
	'politics',
	'photography',
	'science',
	'news',
] satisfies Interest[];

export function useInterestsDisplayNames() {
	return useMemo<Record<string, string>>(() => {
		return {
			// Keep this alphabetized
			animals: m['lib.interest.animals'](),
			art: m['lib.interest.art'](),
			books: m['lib.interest.books'](),
			comedy: m['lib.interest.comedy'](),
			comics: m['lib.interest.comics'](),
			culture: m['lib.interest.culture'](),
			dev: m['lib.interest.softwareDev'](),
			education: m['lib.interest.education'](),
			finance: m['lib.interest.finance'](),
			food: m['lib.interest.food'](),
			gaming: m['common.label.videoGames'](),
			journalism: m['lib.interest.journalism'](),
			movies: m['lib.interest.movies'](),
			music: m['lib.interest.music'](),
			nature: m['lib.interest.nature'](),
			news: m['common.label.news'](),
			pets: m['lib.interest.pets'](),
			photography: m['lib.interest.photography'](),
			politics: m['common.label.politics'](),
			science: m['lib.interest.science'](),
			sports: m['common.label.sports'](),
			tech: m['lib.interest.tech'](),
			tv: m['lib.interest.tv'](),
			writers: m['lib.interest.writers'](),
		} satisfies Record<Interest, string>;
	}, []);
}

/** Sort comparator that floats `boosts` (in their given order) to the front; other items keep their order. */
export function boostInterests(boosts?: string[]) {
	return (a: string, b: string) => {
		const indexA = boosts?.indexOf(a) ?? -1;
		const indexB = boosts?.indexOf(b) ?? -1;
		const rankA = indexA === -1 ? Infinity : indexA;
		const rankB = indexB === -1 ? Infinity : indexB;
		return rankA - rankB;
	};
}
