export const compareBool = (a: boolean, _b?: boolean) => (a ? -1 : 1);

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('compareBool', () => {
		it('should return -1 if a is false', () => {
			expect(compareBool(true)).toEqual(-1);
		});
		it('should return 1 if a is false', () => {
			expect(compareBool(false)).toEqual(1);
		});
	});
}
