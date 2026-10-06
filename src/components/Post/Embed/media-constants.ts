/** max rendered height (px) for a standalone post image or video */
export const MAX_MEDIA_HEIGHT = 430;

/** minimum width (px) needed for video controls */
export const MIN_VIDEO_WIDTH = 280;

/**
 * widens narrow video boxes to fit player controls at the height limit.
 *
 * @param aspectRatio video width-to-height ratio; undefined if unknown
 * @returns box width-to-height ratio; 1 if unknown
 */
export const getVideoBoxRatio = (aspectRatio: number | undefined): number => {
	return Math.max(aspectRatio ?? 1, MIN_VIDEO_WIDTH / MAX_MEDIA_HEIGHT);
};
