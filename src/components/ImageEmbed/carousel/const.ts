export const ITEM_GAP = 8; // tokens.space.sm
export const MIN_ASPECT_RATIO = 9 / 16; // portrait limit
export const MAX_ASPECT_RATIO = 16 / 9; // landscape limit

// Sliver of the next tile kept visible past the first when an image would otherwise fill the whole strip, so
// a multi-image carousel always hints there's more to scroll. Sits clear of the tile's 12px corner radius.
export const CAROUSEL_PEEK = 28; // tokens.space._3xl

// the first two tiles set the preferred height: landscape toward min, portrait toward max.
// CSS can shrink below min to fit the widest tile and a peek of the next.
export const CAROUSEL_MIN_HEIGHT = 235;
export const CAROUSEL_MAX_HEIGHT = 330;
// Chat bubbles run more compact.
export const CAROUSEL_CHAT_MIN_HEIGHT = 120;
export const CAROUSEL_CHAT_MAX_HEIGHT = 180;
export const EMPTY_ASPECT_RATIO = { height: 0, width: 0 };
