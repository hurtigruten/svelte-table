import { toSorted } from './toSorted';
import { compareDyn } from './compareDyn';

export const sortWith = <T>(
	collection: readonly T[],
	predicate: (a: T) => unknown
) => {
	return toSorted(collection, (a, b) => compareDyn(predicate(a), predicate(b)));
};

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const collection = [
		{ name: 'Kate', isActive: true, age: 23 },
		{ name: 'Jared', isActive: false, age: 15 },
		{ name: 'Adam', isActive: true, age: 12 },
		{ name: 'Bogdan', isActive: false, age: 66 }
	] as const;

	describe('sortWith', () => {
		it('should sort by predicate (string)', () => {
			const result = sortWith(collection, (obj) => obj.name);

			expect(result).not.toBe(collection);
			expect(result).toEqual([
				{ name: 'Adam', isActive: true, age: 12 },
				{ name: 'Bogdan', isActive: false, age: 66 },
				{ name: 'Jared', isActive: false, age: 15 },
				{ name: 'Kate', isActive: true, age: 23 }
			]);
		});

		it('should sort by predicate (boolean)', () => {
			const result = sortWith(collection, (obj) => obj.isActive);

			expect(result).not.toBe(collection);
			expect(result).toEqual([
				{ name: 'Adam', isActive: true, age: 12 },
				{ name: 'Kate', isActive: true, age: 23 },
				{ name: 'Jared', isActive: false, age: 15 },
				{ name: 'Bogdan', isActive: false, age: 66 }
			]);
		});

		it('should sort by predicate (int)', () => {
			const result = sortWith(collection, (obj) => obj.age);

			expect(result).not.toBe(collection);
			expect(sortWith(collection, (obj) => obj.age)).toEqual([
				{ name: 'Adam', isActive: true, age: 12 },
				{ name: 'Jared', isActive: false, age: 15 },
				{ name: 'Kate', isActive: true, age: 23 },
				{ name: 'Bogdan', isActive: false, age: 66 }
			]);
		});
	});
}
