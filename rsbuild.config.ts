import path from 'node:path'

import {defineConfig} from '@rsbuild/core'
import {pluginBabel} from '@rsbuild/plugin-babel'
import {pluginReact} from '@rsbuild/plugin-react'

const root = process.cwd()

const transpiledPaths = [
  path.resolve(root, 'index.tsx'),
  path.resolve(root, 'node_modules/react-native'),
  path.resolve(root, 'node_modules/react-native-edge-to-edge'),
  path.resolve(root, 'node_modules/react-native-progress'),
  path.resolve(root, 'node_modules/react-native-safe-area-context'),
  path.resolve(root, 'node_modules/react-native-svg'),
  path.resolve(root, 'src'),
]

export default defineConfig(({envMode}) => {
  return {
    plugins: [
      pluginReact(),
      pluginBabel({
        include: transpiledPaths,
        babelLoaderOptions(options, {addPlugins}) {
          options.presets = []
          options.overrides = [
            {
              plugins: ['@babel/plugin-syntax-jsx'],
              test: /node_modules[/\\]react-native-progress[/\\].*\.jsx?$/,
            },
            {
              plugins: [
                [
                  '@babel/plugin-transform-typescript',
                  {
                    allowNamespaces: true,
                    isTSX: false,
                  },
                ],
              ],
              test: /\.[cm]?ts$/,
            },
            {
              plugins: [
                [
                  '@babel/plugin-transform-typescript',
                  {
                    allowNamespaces: true,
                    isTSX: true,
                  },
                ],
              ],
              test: /\.[cm]?tsx$/,
            },
          ]
          addPlugins([
            '@lingui/babel-plugin-lingui-macro',
            ['babel-plugin-react-compiler', {target: '19'}],
            ...(envMode === 'production' ? ['transform-remove-console'] : []),
          ])
        },
      }),
    ],
    source: {
      entry: {
        index: path.resolve(root, 'index.tsx'),
      },
      include: transpiledPaths,
    },
    html: {
      favicon: path.resolve(root, 'assets/favicon.png'),
      template: path.resolve(root, 'web/index.html'),
      title: 'Bluesky',
    },
    resolve: {
      alias: {
        '#': path.resolve(root, 'src'),
        'react-native': 'react-native-web',
        'react-native-webview': 'react-native-web-webview',
      },
      aliasStrategy: 'prefer-alias',
      conditionNames: ['browser', 'import', 'module', 'default'],
      extensions: [
        '.web.ts',
        '.web.tsx',
        '.web.mjs',
        '.web.js',
        '.web.jsx',
        '.ts',
        '.tsx',
        '.mjs',
        '.js',
        '.jsx',
        '.json',
      ],
    },
    server: {
      historyApiFallback: true,
      port: 19006,
    },
    output: {
      cleanDistPath: true,
      distPath: {root: 'web-build'},
    },
    tools: {
      rspack(config) {
        config.module ??= {}
        config.module.rules ??= []
        config.module.rules.push({
          generator: {
            filename: 'static/[name][ext]',
          },
          test: /postMock\.html$/,
          type: 'asset/resource',
        })
      },
    },
  }
})
