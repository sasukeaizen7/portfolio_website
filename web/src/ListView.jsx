import { layoutGalaxy } from './galaxy/layout';

// The same projects as a plain grid: for small screens, no WebGL, or anyone who prefers it.
export default function ListView({ projects, focus, onSelect }) {
  const systems = layoutGalaxy(projects).filter((s) => !focus || s.category === focus);
  return (
    <main className="list-view">
      {systems.map((s) => (
        <section key={s.category}>
          <h2>{s.category} <span className="count">{s.planets.length}</span></h2>
          <div className="cards">
            {s.planets.map(({ project: p }) => (
              <button key={p.slug} className={`card${p.featured ? ' featured' : ''}`} style={{ '--planet': p.color }} onClick={() => onSelect(p.slug)}>
                {p.imageUrl && <img src={p.imageUrl} alt="" loading="lazy" />}
                <span className="card-period">{p.period}</span>
                <strong>{p.title}</strong>
                <span className="card-summary">{p.summary}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
