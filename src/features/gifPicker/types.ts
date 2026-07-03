/** gif shape returned by the Bluesky GIF proxy. normalized to the Tenor schema. */
export type Gif = {
	created: number;
	hasaudio: boolean;
	id: string;
	media_formats: Record<BaseContentFormats, MediaObject> & Partial<Record<VideoContentFormats, MediaObject>>;
	tags: string[];
	title: string;
	content_description: string;
	itemurl: string;
	hascaption: boolean;
	flags: string;
	bg_color?: string;
	url: string;
};

type MediaObject = {
	url: string;
	dims: [number, number];
	duration: number;
	size: number;
};

type BaseContentFormats = 'preview' | 'gif' | 'tinygif';

type VideoContentFormats = 'mp4' | 'webm';
