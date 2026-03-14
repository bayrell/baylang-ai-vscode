import scss from 'rollup-plugin-scss';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import vue from '@vitejs/plugin-vue';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import path from "path";

const isProduction = process.env.NODE_ENV === 'production';
const compress = () => isProduction ? terser() : null;

/* Options */
const watchOptions = {};
const plugin = () => ({
	generateBundle: () => {
		setTimeout(() => {console.log("Ready")}, 200);
	}
});

export default [
    {
		input: 'app/main.js',
		output: {
			name: 'main',
			file: 'dist/main.js',
			format: 'umd',
			sourcemap: true,
			globals: {
				vue: 'Vue',
			},
		},
		external: ['vue'],
		watch: watchOptions,
		plugins: [
			alias({
				entries: [
					{
						find: "@main",
						replacement: path.resolve(__dirname, "app"),
					}
				],
			}),
			vue(),
			compress(),
			commonjs(),
			plugin(),
			nodeResolve({ preferBuiltins: true }),
			replace({
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify('production'),
				'process.browser': true,
			}),
			scss({
				fileName: 'main.css',
				outputStyle: isProduction ? 'compressed' : 'expanded',
				watch: 'app/*',
				sourcemap: true,
			})
		]
	},
	{
		input: 'app/index.js',
		output: {
			file: 'dist/index.cjs',
			format: 'cjs',
			sourcemap: true
		},
		external: ['vscode', 'path', 'fs', 'os', 'url'],
		watch: watchOptions,
		plugins: [
			nodeResolve({ preferBuiltins: true }),
			commonjs(),
			replace({
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
			}),
			plugin(),
		]
	}
];