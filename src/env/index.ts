export * from '#/env/common';

/** Web-specific platform detection */
export const IS_WEB_TOUCH_DEVICE = window.matchMedia('(pointer: coarse)').matches;
export const IS_WEB_MOBILE_IOS: boolean = /iPhone/.test(navigator.userAgent);
export const IS_WEB_SAFARI: boolean = /^((?!chrome|android).)*safari/i.test(
	// https://stackoverflow.com/questions/7944460/detect-safari-browser
	navigator.userAgent,
);
export const IS_WEB_FIREFOX: boolean = /firefox|fxios/i.test(navigator.userAgent);
