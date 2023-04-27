import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';

export default {
    input: 'lib/cron.js',
    output: [
        { format: 'cjs', file: 'lib/cron.cjs', exports: 'named' },
    ],
    plugins: [
        alias({
            entries: [
                { find: '@lib', replacement: '../lib' },
            ],
        }),
        commonjs(),
    ],
};
