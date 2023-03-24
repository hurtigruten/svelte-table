export const toPaginated = <T>(collection: T[], rowsPerPage: number, from = 0) =>
	[...collection].slice(from, from + rowsPerPage);

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const input = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

	describe('toPaginated', () => {
		it('should split an array from 0 to 5', () => {
			expect(toPaginated(input, 5)).toEqual(['A', 'B', 'C', 'D', 'E']);
		});

		it('should split an array from 2 to 5', () => {
			expect(toPaginated(input, 5, 2)).toEqual(['C', 'D', 'E', 'F', 'G']);
		});

		it('should not throw when out of range', () => {
			expect(toPaginated(input, 10, 6)).toEqual(['G', 'H', 'I']);
			expect(toPaginated(input, 10, 11)).toEqual([]);
		});
	});
}
