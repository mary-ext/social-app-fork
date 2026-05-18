const path = require('node:path')
const {defineConfig} = require('@rsbuild/core')
const {pluginBabel} = require('@rsbuild/plugin-babel')
const {pluginReact} = require('@rsbuild/plugin-react')

const root = process.cwd()

const publicEnvKeys = [
  'PUBLIC_BLUESKY_PROXY_DID',
  'PUBLIC_BUNDLE_DATE',
  'PUBLIC_BUNDLE_IDENTIFIER',
  'PUBLIC_CHAT_PROXY_DID',
  'PUBLIC_ENV',
  'PUBLIC_LOG_DEBUG',
  'PUBLIC_LOG_LEVEL',
  'PUBLIC_RELEASE_VERSION',
]

const transpiledPaths = [
  path.resolve(root, 'src'),
  path.resolve(root, 'index.web.js'),
  path.resolve(root, 'node_modules/react-native'),
  path.resolve(root, 'node_modules/react-native-edge-to-edge'),
  path.resolve(root, 'node_modules/react-native-progress'),
  path.resolve(root, 'node_modules/react-native-safe-area-context'),
  path.resolve(root, 'node_modules/react-native-svg'),
  path.resolve(root, 'node_modules/react-native-view-shot'),
]

const defineEnv = envMode =>
  Object.fromEntries([
    ['__DEV__', JSON.stringify(envMode !== 'production')],
    ...publicEnvKeys.map(key => [
      `process.env.${key}`,
      process.env[key] === undefined
        ? 'undefined'
        : JSON.stringify(process.env[key]),
    ]),
  ])

module.exports = defineConfig(({envMode}) => ({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: transpiledPaths,
      babelLoaderOptions(options, {addPlugins}) {
        options.presets = [
          ['@react-native/babel-preset', {enableBabelRuntime: false}],
        ]
        addPlugins([
          '@babel/plugin-transform-export-namespace-from',
          '@lingui/babel-plugin-lingui-macro',
          ['babel-plugin-react-compiler', {target: '19'}],
          ...(envMode === 'production' ? ['transform-remove-console'] : []),
        ])
      },
    }),
  ],
  source: {
    entry: {
      index: path.resolve(root, 'index.web.js'),
    },
    define: defineEnv(envMode),
    include: transpiledPaths,
  },
  html: {
    template: path.resolve(root, 'web/index.html'),
    title: 'Bluesky',
    favicon: path.resolve(root, 'assets/favicon.png'),
  },
  resolve: {
    aliasStrategy: 'prefer-alias',
    conditionNames: ['browser', 'import', 'module', 'default'],
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ],
    alias: {
      '#': path.resolve(root, 'src'),
      'react-native$': 'react-native-web',
      'react-native-webview': 'react-native-web-webview',
    },
  },
  server: {
    port: 19006,
    historyApiFallback: true,
  },
  output: {
    distPath: {root: 'web-build'},
    cleanDistPath: true,
  },
  tools: {
    rspack(config) {
      config.module ??= {}
      config.module.rules ??= []
      config.module.rules.push({
        test: /postMock\.html$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/[name][ext]',
        },
      })
    },
  },
}))
