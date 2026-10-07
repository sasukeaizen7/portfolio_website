import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';
import { layoutGalaxy } from './galaxy/layout';
import ListView from './ListView';
import { AboutPanel, ProjectPanel } from './ProjectPanel';

const Galaxy = lazy(() => import('./galaxy/Galaxy'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

// #/            galaxy overview
// #/p/<slug>    a project
// #/about       the profile
// #/admin       admin section
function parseHash() {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  if (h === 'admin' || h.startsWith('admin/')) return { admin: true, selected: null };
  if (h === 'about') return { admin: false, selected: 'about' };
  const m = h.match(/^p\/([a-z0-9-]+)$/);
  return { admin: false, selected: m ? m[1] : null };
}

const navigate = (path) => { window.location.hash = path; };

function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

function storedView() {
  try {
    return localStorage.getItem('portfolio.view');
  } catch {
    return null;
  }
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.admin) {
    return (
      <Suspense fallback={<div className="center-note">Loading…</div>}>
        <AdminApp />
      </Suspense>
    );
  }
  return <Explorer selected={route.selected} />;
}

function Explorer({ selected }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const webgl = useMemo(hasWebGL, []);
  const [view, setView] = useState(() => (webgl ? (storedView() ?? 'galaxy') : 'list'));
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    Promise.all([api.projects(), api.profile()])
      .then(([projects, profile]) => setData({ projects, profile }))
      .catch((e) => setError(e.message));
  }, []);

  const changeView = (v) => {
    setView(v);
    try { localStorage.setItem('portfolio.view', v); } catch { /* private mode: not remembered */ }
  };

  // Planet order around the rings, used by the panel's previous/next buttons and the arrow keys.
  const order = useMemo(() => (data ? layoutGalaxy(data.projects).flatMap((s) => s.planets.map((p) => p.project)) : []), [data]);
  const project = order.find((p) => p.slug === selected) ?? null;

  const select = useCallback((slug) => navigate(slug === 'about' ? '/about' : slug ? `/p/${slug}` : '/'), []);
  const step = useCallback((delta) => {
    const i = order.findIndex((p) => p.slug === selected);
    if (i >= 0) select(order[(i + delta + order.length) % order.length].slug);
  }, [order, selected, select]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key === 'Escape' && selected) select(null);
      if (project && e.key === 'ArrowRight') step(1);
      if (project && e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, project, select, step]);

  useEffect(() => {
    document.title = project ? `${project.title} · ${data?.profile.name}` : data ? `${data.profile.name} · Portfolio` : 'Portfolio';
  }, [project, data]);

  if (error) return <div className="center-note">Couldn’t load the portfolio: {error}</div>;
  if (!data) return <div className="center-note"><span className="loader" />Charting the galaxy…</div>;

  const categories = layoutGalaxy(data.projects).map((s) => s.category);

  return (
    <div className={`explorer view-${view}`}>
      {view === 'galaxy' ? (
        <Suspense fallback={<div className="center-note"><span className="loader" />Charting the galaxy…</div>}>
          <Galaxy projects={data.projects} profile={data.profile} selected={selected} focus={focus} onSelect={select} />
        </Suspense>
      ) : (
        <ListView projects={data.projects} focus={focus} onSelect={select} />
      )}

      <header className="hud">
        <button className="brand" onClick={() => select('about')}>
          <span className="brand-name">{data.profile.name}</span>
          <span className="brand-headline">{data.profile.headline}</span>
        </button>
        <nav className="controls" aria-label="View">
          <div className="filters" role="group" aria-label="Filter by category">
            <button className={!focus ? 'chip on' : 'chip'} onClick={() => setFocus(null)}>All</button>
            {categories.map((c) => (
              <button key={c} className={focus === c ? 'chip on' : 'chip'} onClick={() => setFocus(focus === c ? null : c)}>{c}</button>
            ))}
          </div>
          {webgl && (
            <div className="toggle" role="group" aria-label="Layout">
              <button className={view === 'galaxy' ? 'on' : ''} onClick={() => changeView('galaxy')}>3D</button>
              <button className={view === 'list' ? 'on' : ''} onClick={() => changeView('list')}>List</button>
            </div>
          )}
        </nav>
      </header>

      {view === 'galaxy' && !selected && <p className="hint">Drag to orbit · scroll or pinch to zoom · click a planet</p>}

      {project && <ProjectPanel project={project} onClose={() => select(null)} onPrev={() => step(-1)} onNext={() => step(1)} />}
      {selected === 'about' && <AboutPanel profile={data.profile} count={data.projects.length} onClose={() => select(null)} />}
    </div>
  );
}
