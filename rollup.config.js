import scss from 'rollup-plugin-scss';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import vue from '@vitejs/plugin-vue';

const isProduction = false;
const compress = () => isProduction ? terser() : null;

export default [
    {
		input: 'app/main.js',
		output: {
			name: 'main',
			file: 'dist/main.js',
			format: 'umd',
			sourcemap: isProduction == false,
			globals: {
				vue: 'Vue',
			},
		},
		external: ['vue'],
		plugins: [
			vue(),
			compress(),
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
	}
];