import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		css: false,
		passWithNoTests: true,
		setupFiles: ['./setupTests.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}', 'src/lib/utils/**/*.{js,ts}']
	}
});
