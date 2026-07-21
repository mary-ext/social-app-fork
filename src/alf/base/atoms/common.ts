import type { ViewStyle } from 'react-native';

import * as tokens from '../tokens';
import type { ShadowStyle } from './types';

export const atoms = {
	/*
	 * Positioning
	 */
	fixed: {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- web-only CSS value the RNW renderer forwards
		position: 'fixed' as ViewStyle['position'],
	},
	absolute: {
		position: 'absolute',
	},
	relative: {
		position: 'relative',
	},
	sticky: {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- web-only CSS value the RNW renderer forwards
		position: 'sticky' as ViewStyle['position'],
	},
	inset_0: {
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	right_0: {
		right: 0,
	},
	bottom_0: {
		bottom: 0,
	},
	left_0: {
		left: 0,
	},
	z_10: {
		zIndex: 10,
	},
	z_20: {
		zIndex: 20,
	},
	z_50: {
		zIndex: 50,
	},
	overflow_hidden: {
		overflow: 'hidden',
	},

	/*
	 * Width & Height
	 */
	w_full: {
		width: '100%',
	},
	h_full: {
		height: '100%',
	},
	max_w_full: {
		maxWidth: '100%',
	},
	rounded_xs: {
		borderRadius: tokens.borderRadius.xs,
	},
	rounded_sm: {
		borderRadius: tokens.borderRadius.sm,
	},
	rounded_md: {
		borderRadius: tokens.borderRadius.md,
	},
	rounded_xl: {
		borderRadius: tokens.borderRadius.xl,
	},
	rounded_full: {
		borderRadius: tokens.borderRadius.full,
	},
	gap_2xs: {
		gap: tokens.space._2xs,
	},
	gap_xs: {
		gap: tokens.space.xs,
	},
	gap_sm: {
		gap: tokens.space.sm,
	},
	gap_md: {
		gap: tokens.space.md,
	},
	gap_lg: {
		gap: tokens.space.lg,
	},
	gap_xl: {
		gap: tokens.space.xl,
	},
	gap_5xl: {
		gap: tokens.space._5xl,
	},
	flex: {
		display: 'flex',
	},
	flex_col: {
		flexDirection: 'column',
	},
	flex_row: {
		flexDirection: 'row',
	},
	flex_row_reverse: {
		flexDirection: 'row-reverse',
	},
	flex_wrap: {
		flexWrap: 'wrap',
	},
	flex_1: {
		flex: 1,
	},
	flex_grow: {
		flexGrow: 1,
	},
	flex_shrink: {
		flexShrink: 1,
	},
	flex_shrink_0: {
		flexShrink: 0,
	},
	justify_start: {
		justifyContent: 'flex-start',
	},
	justify_center: {
		justifyContent: 'center',
	},
	justify_between: {
		justifyContent: 'space-between',
	},
	justify_end: {
		justifyContent: 'flex-end',
	},
	align_center: {
		alignItems: 'center',
	},
	align_start: {
		alignItems: 'flex-start',
	},
	align_end: {
		alignItems: 'flex-end',
	},
	self_start: {
		alignSelf: 'flex-start',
	},
	self_end: {
		alignSelf: 'flex-end',
	},

	/*
	 * Text
	 */
	text_left: {
		textAlign: 'left',
	},
	text_center: {
		textAlign: 'center',
	},
	text_right: {
		textAlign: 'right',
	},
	text_xs: {
		fontSize: tokens.fontSize.xs,
		letterSpacing: tokens.TRACKING,
	},
	text_sm: {
		fontSize: tokens.fontSize.sm,
		letterSpacing: tokens.TRACKING,
	},
	text_md: {
		fontSize: tokens.fontSize.md,
		letterSpacing: tokens.TRACKING,
	},
	text_lg: {
		fontSize: tokens.fontSize.lg,
		letterSpacing: tokens.TRACKING,
	},
	text_xl: {
		fontSize: tokens.fontSize.xl,
		letterSpacing: tokens.TRACKING,
	},
	text_2xl: {
		fontSize: tokens.fontSize._2xl,
		letterSpacing: tokens.TRACKING,
	},
	text_3xl: {
		fontSize: tokens.fontSize._3xl,
		letterSpacing: tokens.TRACKING,
	},
	text_4xl: {
		fontSize: tokens.fontSize._4xl,
		letterSpacing: tokens.TRACKING,
	},
	leading_tight: {
		lineHeight: tokens.lineHeight.tight,
	},
	leading_snug: {
		lineHeight: tokens.lineHeight.snug,
	},
	font_medium: {
		fontWeight: tokens.fontWeight.medium,
	},
	font_semi_bold: {
		fontWeight: tokens.fontWeight.semiBold,
	},
	font_bold: {
		fontWeight: tokens.fontWeight.bold,
	},
	italic: {
		fontStyle: 'italic',
	},

	/*
	 * Border
	 */
	border_0: {
		borderWidth: 0,
	},
	border: {
		borderWidth: 1,
	},
	border_t: {
		borderTopWidth: 1,
	},
	border_b: {
		borderBottomWidth: 1,
	},
	border_l: {
		borderLeftWidth: 1,
	},
	border_x: {
		borderLeftWidth: 1,
		borderRightWidth: 1,
	},
	curve_continuous: {},

	shadow_xs: {} as ShadowStyle,
	shadow_sm: {} as ShadowStyle,
	shadow_md: {} as ShadowStyle,
	shadow_lg: {} as ShadowStyle,
	p_sm: {
		padding: tokens.space.sm,
	},
	p_md: {
		padding: tokens.space.md,
	},
	p_lg: {
		padding: tokens.space.lg,
	},
	p_xl: {
		padding: tokens.space.xl,
	},
	p_2xl: {
		padding: tokens.space._2xl,
	},
	px_2xs: {
		paddingLeft: tokens.space._2xs,
		paddingRight: tokens.space._2xs,
	},
	px_sm: {
		paddingLeft: tokens.space.sm,
		paddingRight: tokens.space.sm,
	},
	px_md: {
		paddingLeft: tokens.space.md,
		paddingRight: tokens.space.md,
	},
	px_lg: {
		paddingLeft: tokens.space.lg,
		paddingRight: tokens.space.lg,
	},
	px_xl: {
		paddingLeft: tokens.space.xl,
		paddingRight: tokens.space.xl,
	},
	py_xs: {
		paddingTop: tokens.space.xs,
		paddingBottom: tokens.space.xs,
	},
	py_sm: {
		paddingTop: tokens.space.sm,
		paddingBottom: tokens.space.sm,
	},
	py_md: {
		paddingTop: tokens.space.md,
		paddingBottom: tokens.space.md,
	},
	py_lg: {
		paddingTop: tokens.space.lg,
		paddingBottom: tokens.space.lg,
	},
	py_3xl: {
		paddingTop: tokens.space._3xl,
		paddingBottom: tokens.space._3xl,
	},
	py_4xl: {
		paddingTop: tokens.space._4xl,
		paddingBottom: tokens.space._4xl,
	},
	pt_xs: {
		paddingTop: tokens.space.xs,
	},
	pt_sm: {
		paddingTop: tokens.space.sm,
	},
	pt_md: {
		paddingTop: tokens.space.md,
	},
	pt_lg: {
		paddingTop: tokens.space.lg,
	},
	pt_2xl: {
		paddingTop: tokens.space._2xl,
	},
	pt_5xl: {
		paddingTop: tokens.space._5xl,
	},
	pb_2xs: {
		paddingBottom: tokens.space._2xs,
	},
	pb_xs: {
		paddingBottom: tokens.space.xs,
	},
	pb_sm: {
		paddingBottom: tokens.space.sm,
	},
	pb_lg: {
		paddingBottom: tokens.space.lg,
	},
	pb_xl: {
		paddingBottom: tokens.space.xl,
	},
	pb_2xl: {
		paddingBottom: tokens.space._2xl,
	},
	pb_5xl: {
		paddingBottom: tokens.space._5xl,
	},
	pl_xs: {
		paddingLeft: tokens.space.xs,
	},
	pl_md: {
		paddingLeft: tokens.space.md,
	},
	pl_lg: {
		paddingLeft: tokens.space.lg,
	},
	pr_sm: {
		paddingRight: tokens.space.sm,
	},
	pr_md: {
		paddingRight: tokens.space.md,
	},
	mx_sm: {
		marginLeft: tokens.space.sm,
		marginRight: tokens.space.sm,
	},
	mx_md: {
		marginLeft: tokens.space.md,
		marginRight: tokens.space.md,
	},
	mx_lg: {
		marginLeft: tokens.space.lg,
		marginRight: tokens.space.lg,
	},
	my_2xs: {
		marginTop: tokens.space._2xs,
		marginBottom: tokens.space._2xs,
	},
	my_md: {
		marginTop: tokens.space.md,
		marginBottom: tokens.space.md,
	},
	mt_xs: {
		marginTop: tokens.space.xs,
	},
	mt_sm: {
		marginTop: tokens.space.sm,
	},
	mt_md: {
		marginTop: tokens.space.md,
	},
	mt_lg: {
		marginTop: tokens.space.lg,
	},
	mb_2xs: {
		marginBottom: tokens.space._2xs,
	},
	mb_xs: {
		marginBottom: tokens.space.xs,
	},
	mb_4xl: {
		marginBottom: tokens.space._4xl,
	},
	ml_2xs: {
		marginLeft: tokens.space._2xs,
	},
	ml_xs: {
		marginLeft: tokens.space.xs,
	},
	ml_sm: {
		marginLeft: tokens.space.sm,
	},
	mr_xs: {
		marginRight: tokens.space.xs,
	},
	mr_md: {
		marginRight: tokens.space.md,
	},

	/*
	 * Pointer events & user select
	 */
	pointer_events_none: {
		pointerEvents: 'none',
	},
} as const;
