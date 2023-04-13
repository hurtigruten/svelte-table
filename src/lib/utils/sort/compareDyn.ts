import { compareBool } from './compareBool';
import { compareNum } from './compareNum';
import { compareString } from './compareString';

export const compareDyn = <T>(a: T, b: T) => {
	if (a instanceof Date && b instanceof Date) return compareNum(Number(a), Number(b));
	if (typeof a === 'boolean') return compareBool(a);
	if (typeof a === 'number' && typeof b === 'number') return compareNum(a, b);

	return compareString(String(a), String(b));
};

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('compareDyn', () => {
		it('should use bool strategy', () => {
			expect(compareDyn(true, false)).toEqual(-1);
			expect(compareDyn(false, true)).toEqual(1);
		});
		it('should use number strategy', () => {
			expect(compareDyn(3, 3)).toEqual(0);
			expect(compareDyn(1, 5)).toEqual(-1);
			expect(compareDyn(5, 1)).toEqual(1);
		});
		it('should use string strategy', () => {
			expect(compareDyn('A', 'Z')).toEqual(-1);
			expect(compareDyn('Z', 'A')).toEqual(1);
			expect(compareDyn('B', 'B')).toEqual(0);
		});
	});
}
