// This is a polyfill for an API that sorts an array without mutating it
// https://github.com/tc39/proposal-change-array-by-copy

export const toSorted = <T>(
	arr: readonly T[],
	sortFn: Parameters<(typeof Array)['prototype']['sort']>[0] = undefined
) => [...arr].sort(sortFn);

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('toSorted', () => {
		it('should sort an array without sortFn', () => {
			const input = ['z', 'b', 'c', 'a'];

			expect(toSorted(input)).toEqual(['a', 'b', 'c', 'z']);
			expect(toSorted(input)).not.toEqual(input);
		});

		it('should sort numbers', () => {
			const input = [100, 5, 25, 1];
			const sortFn = (a: number, b: number) => a - b;

			expect(toSorted(input, sortFn)).toEqual([1, 5, 25, 100]);
			expect(toSorted(input, sortFn)).not.toEqual(input);
		});
		it('should not mutate the array', () => {
			const input = [1, 2, 3, 4, 5];
			const sortFn = (a: number, b: number) => b - a;

			expect(toSorted(input, sortFn)).toEqual([5, 4, 3, 2, 1]);
			expect(toSorted(input, sortFn)).not.toEqual(input);
		});
	});
}
