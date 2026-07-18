import { globalStyle } from '@vanilla-extract/css';

import { reset } from '#/styles/layers.css';

globalStyle('a', {
	'@layer': {
		[reset]: { textDecoration: 'none', color: 'inherit' },
	},
});

globalStyle('button, input, textarea', {
	'@layer': { [reset]: { lineHeight: 'inherit', font: 'inherit' } },
});

globalStyle('input:focus, textarea:focus', { '@layer': { [reset]: { outline: 0 } } });
