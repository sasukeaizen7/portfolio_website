import { describe, expect, it } from 'vitest';
import { FIRST_ORBIT, ORBIT_GAP, layoutGalaxy } from './layout';

const p = (slug, category, extra = {}) => ({ slug, title: slug, category, sortOrder: 0, featured: false, ...extra });

describe('layoutGalaxy', () => {
  it('puts each category on its own ring, smallest categories innermost', () => {
    const systems = layoutGalaxy([p('a', 'Big'), p('b', 'Big'), p('c', 'Big'), p('d', 'Small')]);
    expect(systems.map((s) => [s.category, s.radius])).toEqual([['Small', FIRST_ORBIT], ['Big', FIRST_ORBIT + ORBIT_GAP]]);
  });

  it('spaces planets evenly on their ring, in sort order', () => {
    const [ring] = layoutGalaxy([p('x', 'C', { sortOrder: 2 }), p('y', 'C', { sortOrder: 1 }), p('z', 'C', { sortOrder: 3 })]);
    expect(ring.planets.map((pl) => pl.project.slug)).toEqual(['y', 'x', 'z']);
    for (const { position: [x, , z] } of ring.planets) expect(Math.hypot(x, z)).toBeCloseTo(ring.radius);
    const angles = ring.planets.map(({ position: [x, , z] }) => Math.atan2(z, x));
    const gap = (a, b) => ((b - a + 2 * Math.PI) % (2 * Math.PI));
    expect(gap(angles[0], angles[1])).toBeCloseTo((2 * Math.PI) / 3);
  });

  it('is deterministic', () => {
    const input = [p('a', 'X'), p('b', 'Y', { featured: true })];
    expect(layoutGalaxy(input)).toEqual(layoutGalaxy(input));
  });

  it('handles an empty galaxy', () => {
    expect(layoutGalaxy([])).toEqual([]);
  });
});
