import { describe, it, expect } from 'vitest';
import { measureDistance, standardViewDir, fitDistance } from './viewerMath';

describe('viewerMath', () => {
  it('measureDistance is Euclidean', () => {
    expect(measureDistance([0, 0, 0], [3, 4, 0])).toBeCloseTo(5);
  });

  it('standardViewDir returns unit directions', () => {
    expect(standardViewDir('top')).toEqual([0, 0, 1]);
    expect(standardViewDir('front')).toEqual([0, -1, 0]);
    const iso = standardViewDir('iso');
    const len = Math.hypot(...iso);
    expect(len).toBeCloseTo(1);
  });

  it('fitDistance grows with bbox size and fov', () => {
    const small = fitDistance([2, 2, 2], 50);
    const big = fitDistance([20, 20, 20], 50);
    expect(big).toBeGreaterThan(small);
    expect(small).toBeGreaterThan(0);
  });
});
