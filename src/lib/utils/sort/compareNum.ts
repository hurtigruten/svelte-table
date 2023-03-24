export const compareNum = (a: number, b: number) => {
	if (a === b) return 0;
	return a > b ? 1 : -1;
};

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('compareString', () => {
		it('should return -1 if a is less than b', () => {
			expect(compareNum(1, 3)).toEqual(-1);
		});
		it('should return 0 if a is same as b', () => {
			expect(compareNum(3, 3)).toEqual(0);
		});
		it('should return 1 if a is higher than b', () => {
			expect(compareNum(5, 1)).toEqual(1);
		});
	});
}
