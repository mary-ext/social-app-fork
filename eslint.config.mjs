// @ts-check
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import bskyInternal from 'eslint-plugin-bsky-internal';
import importX from 'eslint-plugin-import-x';
import lingui from 'eslint-plugin-lingui';
import react from 'eslint-plugin-react';
import reactCompiler from 'eslint-plugin-react-compiler';
import reactHooks from 'eslint-plugin-react-hooks';
// @ts-expect-error no types
import reactNative from 'eslint-plugin-react-native';
// @ts-expect-error no types
import reactNativeA11y from 'eslint-plugin-react-native-a11y';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	/** Global ignores */
	{
		ignores: [
			'ios/**',
			'android/**',
			'coverage/**',
			'*.lock',
			'patches/**',
			'*.html',
			'src/locale/locales/_build/**',
			'src/locale/locales/**/*.js',
			'eslint.config.mjs',
		],
	},

	/** Base configurations */
	js.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	reactHooks.configs.flat.recommended,
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	importX.flatConfigs['react-native'],

	/** Main configuration for all JS/TS/JSX/TSX files */
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			react,
			'react-native': reactNative,
			'react-native-a11y': reactNativeA11y,
			// @ts-expect-error - not sure why
			lingui,
			'react-compiler': reactCompiler,
			'bsky-internal': bskyInternal,
		},
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				parser: tsParser,
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
			componentWrapperFunctions: ['observer'],
		},
		rules: {
			/** Custom rules */
			'bsky-internal/avoid-unwrapped-text': [
				'error',
				{
					impliedTextComponents: [
						'H1',
						'H2',
						'H3',
						'H4',
						'H5',
						'H6',
						'P',
						'Admonition',
						'Admonition.Admonition',
						'Toast.Action',
						'AgeAssuranceAdmonition',
						'Span',
						'StackedButton',
					],
					impliedTextProps: [],
					suggestedTextWrappers: {
						Button: 'ButtonText',
						'ToggleButton.Button': 'ToggleButton.ButtonText',
						'SegmentedControl.Item': 'SegmentedControl.ItemText',
					},
				},
			],
			'bsky-internal/consistent-type-imports': 'error',
			'bsky-internal/use-prefixed-imports': 'error',
			'bsky-internal/lingui-msg-rule': 'error',

			/** React & React Native */
			...react.configs.recommended.rules,
			...react.configs['jsx-runtime'].rules,
			'react/hook-use-state': 'warn',
			'react/no-unescaped-entities': 'off',
			'react/prop-types': 'off',
			'react-native/no-inline-styles': 'off',
			...reactNativeA11y.configs.all.rules,
			'react-compiler/react-compiler': 'warn',
			// TODO: Fix these and set to error
			'react-hooks/set-state-in-effect': 'warn',
			'react-hooks/purity': 'warn',
			'react-hooks/refs': 'warn',
			'react-hooks/immutability': 'warn',

			/** Import linting */
			'import-x/no-unresolved': [
				'error',
				{
					/*
					 * The `postinstall` hook runs `compile-if-needed` locally, but not in
					 * CI. For CI-sake, ignore this.
					 */
					ignore: ['^#\/locale\/locales\/.+\/messages'],
				},
			],
			'import-x/no-extraneous-dependencies': [
				'error',
				{
					whitelist: [
						// we only use a really simple util from this, and we know it will be present
						'expo-modules-core',
						// this is a dep for @atproto/api, but we absolutely need them in sync, so just
						// rely on the transient version
						'@atproto/common-web',
					],
				},
			],
			'import-x/no-nodejs-modules': 'error',

			/** TypeScript-specific rules */
			'no-unused-vars': 'off', // off, we use TS-specific rule below
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_.+',
					caughtErrors: 'none',
					ignoreRestSiblings: true,
				},
			],
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unused-expressions': [
				'error',
				{
					allowTernary: true,
				},
			],
			/**
			 * Maintain previous behavior - these are stricter in typescript-eslint v8 `warn` ones are probably
			 * worth fixing. `off` ones are a bit too nit-picky
			 */
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-misused-promises': 'warn',
			'@typescript-eslint/require-await': 'warn',
			'@typescript-eslint/no-unsafe-enum-comparison': 'warn',
			'@typescript-eslint/no-unnecessary-type-assertion': 'warn',
			'@typescript-eslint/no-redundant-type-constituents': 'warn',
			'@typescript-eslint/no-duplicate-type-constituents': 'warn',
			'@typescript-eslint/no-base-to-string': 'warn',
			'@typescript-eslint/prefer-promise-reject-errors': 'warn',
			'@typescript-eslint/await-thenable': 'warn',

			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react',
							importNames: ['React', 'default'],
							message:
								'React is already in the global type namespace. Use named imports for runtime modules.',
						},
					],
				},
			],

			/** Turn off rules that we haven't enforced thus far */
			'no-empty-pattern': 'off',
			'no-async-promise-executor': 'off',
			'no-constant-binary-expression': 'warn',
			'prefer-const': 'off',
			'no-empty': 'off',
			'no-unsafe-optional-chaining': 'off',
			'no-prototype-builtins': 'off',
			'no-var': 'off',
			'prefer-rest-params': 'off',
			'no-case-declarations': 'off',
			'no-irregular-whitespace': 'off',
			'no-useless-escape': 'off',
			'no-sparse-arrays': 'off',
			'no-fallthrough': 'off',
			'no-control-regex': 'off',
		},
	},
);
