import { test } from 'node:test';

import { RuleTester } from 'oxlint/plugins-dev';

import rule from './recipe-debug-id.js';

test('recipe-debug-id', () => {
	const ruleTester = new RuleTester();

	ruleTester.run('recipe-debug-id', rule, {
		valid: [
			{
				code: "import { recipe } from '#/styles/recipe'; const foo = recipe({}, { debugId: 'foo' });",
			},
			{
				code: "import { recipe } from '#/styles/recipe'; function f(recipe) { recipe({}); }",
			},
			{
				code: "import { style } from '#/styles/recipe'; const foo = style({});",
			},
		],
		invalid: [
			{
				code: "import { recipe } from '#/styles/recipe'; const foo = recipe({});",
				errors: [{ messageId: 'missingDebugId' }],
				output: "import { recipe } from '#/styles/recipe'; const foo = recipe({}, { debugId: 'foo' });",
			},
			{
				code: "import { recipe } from '#/styles/recipe'; const foo = recipe({}, { layer: 'x' });",
				errors: [{ messageId: 'missingDebugId' }],
				output:
					"import { recipe } from '#/styles/recipe'; const foo = recipe({}, { debugId: 'foo', layer: 'x' });",
			},
			{
				code: "import { recipe as r } from '#/styles/recipe'; const foo = r({});",
				errors: [{ messageId: 'missingDebugId' }],
				output: "import { recipe as r } from '#/styles/recipe'; const foo = r({}, { debugId: 'foo' });",
			},
			{
				code: "import { recipe } from '#/styles/recipe'; export default recipe({});",
				errors: [{ messageId: 'missingDebugId' }],
				output: null,
			},
			{
				code: "import { recipe } from '#/styles/recipe'; const foo = recipe({}, {\n\tlayer: 'x',\n});",
				errors: [{ messageId: 'missingDebugId' }],
				output: null,
			},
		],
	});
});
