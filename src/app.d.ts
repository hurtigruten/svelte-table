// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { expect, describe, it } from 'vitest';

declare global {
	interface ImportMeta {
		vitest: null | {
			expect: typeof expect;
			describe: typeof describe;
			it: typeof it;
		};
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
