import {defineConfig} from 'rollup';
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import babel from "@rollup/plugin-babel";

export default defineConfig({
    input: {
        main: 'src/main.ts'
    },
    output: {
        dir: 'bin',
        banner: '#!/usr/bin/env node\n',
        format: 'commonjs',
        esModule: false,
        strict: true,
        sourcemap: true,
        exports: 'none',
    },
    plugins: [
        nodeResolve({
            preferBuiltins: true,
            exportConditions: ['node', 'default', 'module', 'import']
        }),
        commonjs(),
        typescript(),
        babel({
            babelHelpers: "bundled",
            presets: [['@babel/preset-env', {
                useBuiltIns: "usage",
                corejs: "3",
                targets: 'node 12',
            }]]
        }),
    ]
})
