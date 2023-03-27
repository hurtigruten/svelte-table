// This is a polyfill for an API that reverts an array without mutating it
// https://www.npmjs.com/package/array.prototype.toReverted

export const toReverted = <T>(arr: readonly T[]) => [...arr].reverse();

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('toReverted', () => {
		it('should revert the order without mutating the input', () => {
			const input = ['z', 'b', 'c', 'a'];

			expect(toReverted(input)).toEqual(['a', 'c', 'b', 'z']);
			expect(toReverted(input)).not.toEqual(input);
		});
	});
}
