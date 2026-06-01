'use strict';

const plugin = {
	meta: {
		name: 'eslint-plugin-bsky-internal',
		version: '1.0.0',
	},
	rules: {
		'avoid-unwrapped-text': require('./avoid-unwrapped-text'),
		'consistent-type-imports': require('./consistent-type-imports'),
		'lingui-msg-rule': require('./lingui-msg-rule'),
		'use-prefixed-imports': require('./use-prefixed-imports'),
	},
};

module.exports = plugin;
