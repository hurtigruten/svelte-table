export const compareString = (a: string, b: string) => a.localeCompare(b);

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('compareString', () => {
		it('should return -1 if a is less than b', () => {
			expect(compareString('Alphabet', 'Blphabet')).toEqual(-1);
		});
		it('should return 0 if a is same as b', () => {
			expect(compareString('Alphabet', 'Alphabet')).toEqual(0);
		});
		it('should return 1 if a is higher than b', () => {
			expect(compareString('Blphabet', 'Alphabet')).toEqual(1);
		});
	});
}
