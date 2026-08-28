import { style } from '@vanilla-extract/css';

// GitHub's syntax palette.
const token = (light: string, dark: string) =>
	style({
		color: light,
		selectors: {
			'.theme--dark &, .theme--dim &': { color: dark },
		},
	});

const added = token('#116329', '#aff5b4');
const blue = token('#0550ae', '#79c0ff');
const green = token('#116329', '#7ee787');
const grey = token('#6e7781', '#8b949e');
const navy = token('#0a3069', '#a5d6ff');
const orange = token('#953800', '#ffa657');
const purple = token('#8250df', '#d2a8ff');
const red = token('#cf222e', '#ff7b72');
const removed = token('#82071e', '#ffdcd7');

export const scopeClasses: Record<string, string> = {
	addition: added,
	attr: blue,
	attribute: blue,
	built_in: orange,
	comment: grey,
	deletion: removed,
	keyword: red,
	literal: blue,
	meta: grey,
	name: green,
	number: blue,
	property: blue,
	regexp: navy,
	'selector-tag': green,
	string: navy,
	symbol: blue,
	tag: green,
	title: purple,
	'title.class_': orange,
	'title.function_': purple,
	type: red,
	variable: orange,
};
