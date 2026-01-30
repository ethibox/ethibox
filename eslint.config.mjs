import js from '@eslint/js';
import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';
import pluginCypress from 'eslint-plugin-cypress';
import pluginJest from 'eslint-plugin-jest';

const compat = new FlatCompat({
    baseDirectory: process.cwd(),
    recommendedConfig: js.configs.recommended,
});

export default [
    ...compat.extends('airbnb'),
    { ignores: ['.next/'] },
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            indent: [2, 4, { SwitchCase: 1 }],
            'max-len': [0],
            'object-curly-newline': [0],
            'import/extensions': [0],
            'import/no-extraneous-dependencies': [0],
            'import/prefer-default-export': [0],
            'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
            'react/jsx-props-no-spreading': [0],
            'react/jsx-indent-props': [2, 4],
            'react/jsx-indent': [2, 4],
            'react/prop-types': [0],
            'react/no-unescaped-entities': [0],
            'react/function-component-definition': [0],
            'react/react-in-jsx-scope': [0],
            'no-restricted-syntax': [0],
            complexity: [2, 7],
            'max-depth': [2, 2],
        },
    },
    {
        files: ['__tests__/e2e/**/*'],
        ...pluginCypress.configs.recommended,
        rules: {
            ...pluginCypress.configs.recommended.rules,
            'cypress/no-unnecessary-waiting': 0,
            'cypress/unsafe-to-chain-command': 0,
        },
    },
    {
        files: ['__tests__/unit/**/*'],
        ...pluginJest.configs['flat/recommended'],
        rules: {
            ...pluginJest.configs['flat/recommended'].rules,
            'jest/expect-expect': 0,
        },
    },
];
