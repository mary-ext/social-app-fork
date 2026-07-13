import { globalStyle } from '@vanilla-extract/css';

import { reset } from '#/styles/layers.css';

globalStyle('a', {
	'@layer': {
		[reset]: { color: 'inherit', textDecoration: 'none' },
	},
});

globalStyle('button, input, textarea', {
	'@layer': { [reset]: { font: 'inherit', lineHeight: 'inherit' } },
});

globalStyle('input:focus, textarea:focus', { '@layer': { [reset]: { outline: 0 } } });
