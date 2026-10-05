import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

import * as headerCss from '../post/PostHeader.css';
import * as railCss from '../post/PostRail.css';
import { POST_GAP_CENTER, RAIL_WIDTH, RIGHT_PADDING } from '../shared/layout';

export const root = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	paddingRight: RIGHT_PADDING,
	paddingBottom: POST_GAP_CENTER * 2,
	paddingLeft: RAIL_WIDTH,
});

export const rail = style([railCss.root]);

export const line = style([railCss.line]);

export const header = style({
	display: 'flex',
	paddingBottom: space._2xs,
	alignItems: 'center',
});

export const badges = style([headerCss.badges]);

export const alerts = style({
	paddingBottom: space.xs,
});
