// Places projects in 3D: one orbit ring per category around a central star.
// Pure function (no three.js) so it can be unit-tested.

export const FIRST_ORBIT = 14;
export const ORBIT_GAP = 11;

// Small deterministic hash so a project keeps the same height and phase between visits.
export function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export function planetSize(project) {
  return project.featured ? 1.15 : 0.62;
}

export function layoutGalaxy(projects) {
  const categories = [];
  const byCategory = new Map();
  for (const p of projects) {
    if (!byCategory.has(p.category)) {
      byCategory.set(p.category, []);
      categories.push(p.category);
    }
    byCategory.get(p.category).push(p);
  }
  // Smaller categories on the inner orbits: outer rings are longer, so crowded categories get the room.
  categories.sort((a, b) => byCategory.get(a).length - byCategory.get(b).length || a.localeCompare(b));

  return categories.map((category, ring) => {
    const items = [...byCategory.get(category)].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    const radius = FIRST_ORBIT + ring * ORBIT_GAP;
    const offset = hash(category) * Math.PI * 2;
    return {
      category,
      radius,
      tilt: ((ring % 2 ? -1 : 1) * (0.08 + ring * 0.05)),
      speed: 0.035 / (ring + 1),
      planets: items.map((project, i) => {
        const angle = offset + (i / items.length) * Math.PI * 2;
        return {
          project,
          size: planetSize(project),
          position: [Math.cos(angle) * radius, (hash(project.slug) - 0.5) * 1.6, Math.sin(angle) * radius],
        };
      }),
    };
  });
}
