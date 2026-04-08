import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	resolve: {
		conditions: ['browser'],
		alias: {
			$lib: path.resolve(__dirname, 'src/lib'),
			'$app/environment': path.resolve(__dirname, 'src/lib/__mocks__/app-environment.ts')
		}
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts']
	}
});
