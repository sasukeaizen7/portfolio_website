import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSite } from '../lib/useSite';
import ListView from '../ListView';
import { AboutPanel, ProjectPanel } from '../ProjectPanel';
import { layoutGalaxy } from './layout';

const Galaxy = lazy(() => import('./Galaxy'));

const go = (path) => { window.location.hash = path; };

function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

// The projects as a 3D galaxy: one orbit per category, click a planet to fly to it.
export default function Explorer({ selected }) {
  const { data, error } = useSite();
  const webgl = useMemo(hasWebGL, []);
  const [focus, setFocus] = useState(null);

  const order = useMemo(() => (data ? layoutGalaxy(data.projects).flatMap((s) => s.planets.map((p) => p.project)) : []), [data]);
  const project = order.find((p) => p.slug === selected) ?? null;

  const select = useCallback((slug) => go(slug ? `/galaxy/${slug}` : '/galaxy'), []);
  const step = useCallback((delta) => {
    const i = order.findIndex((p) => p.slug === selected);
    if (i >= 0) select(order[(i + delta + order.length) % order.length].slug);
  }, [order, selected, select]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && selected) select(null);
      if (project && e.key === 'ArrowRight') step(1);
      if (project && e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, project, select, step]);

  useEffect(() => {
    if (data) document.title = project ? `${project.title} · ${data.profile.name}` : `Projects in 3D · ${data.profile.name}`;
  }, [project, data]);

  if (error) return <div className="center-note">Couldn’t load the projects: {error}</div>;
  if (!data) return <div className="center-note"><span className="loader" />Charting the galaxy…</div>;

  const categories = layoutGalaxy(data.projects).map((s) => s.category);

  return (
    <div className={`explorer view-${webgl ? 'galaxy' : 'list'}`}>
      {webgl ? (
        <Suspense fallback={<div className="center-note"><span className="loader" />Charting the galaxy…</div>}>
          <Galaxy projects={data.projects} profile={data.profile} selected={selected} focus={focus} onSelect={select} />
        </Suspense>
      ) : (
        <ListView projects={data.projects} focus={focus} onSelect={select} />
      )}

      <header className="hud">
        <a className="back-home" href="#/">← {data.profile.name}</a>
        <nav className="controls" aria-label="Filter by category">
          <div className="filters" role="group">
            <button className={!focus ? 'chip on' : 'chip'} onClick={() => setFocus(null)}>All</button>
            {categories.map((c) => (
              <button key={c} className={focus === c ? 'chip on' : 'chip'} onClick={() => setFocus(focus === c ? null : c)}>{c}</button>
            ))}
          </div>
        </nav>
      </header>

      {webgl && !selected && <p className="hint">Drag to orbit · scroll or pinch to zoom · click a planet</p>}

      {project && <ProjectPanel project={project} onClose={() => select(null)} onPrev={() => step(-1)} onNext={() => step(1)} />}
      {selected === 'about' && <AboutPanel profile={data.profile} count={data.projects.length} onClose={() => select(null)} />}
    </div>
  );
}
