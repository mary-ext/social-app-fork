import avoidUnwrappedText from './avoid-unwrapped-text.js';
import consistentTypeImports from './consistent-type-imports.js';
import recipeDebugId from './recipe-debug-id.js';
import usePrefixedImports from './use-prefixed-imports.js';

const plugin = {
	meta: {
		name: 'eslint-plugin-bsky-internal',
		version: '1.0.0',
	},
	rules: {
		'avoid-unwrapped-text': avoidUnwrappedText,
		'consistent-type-imports': consistentTypeImports,
		'recipe-debug-id': recipeDebugId,
		'use-prefixed-imports': usePrefixedImports,
	},
};

export default plugin;
