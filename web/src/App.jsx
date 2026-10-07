import { lazy, Suspense, useEffect, useState } from 'react';
import Home from './site/Home';
import ProjectPage from './site/ProjectPage';

const Explorer = lazy(() => import('./galaxy/Explorer'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

// #/                    home (one page: hero, about, experience, projects, skills, contact)
// #/projects/<slug>     a project case study
// #/galaxy[/<slug>]     the projects as a 3D galaxy
// #/admin               admin section
function parseHash() {
  const path = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const [page, arg] = path.split('/');
  if (page === 'admin') return { page: 'admin' };
  if (page === 'projects' && /^[a-z0-9-]+$/.test(arg ?? '')) return { page: 'project', slug: arg };
  if (page === 'galaxy') return { page: 'galaxy', selected: arg && /^[a-z0-9-]+$/.test(arg) ? arg : null };
  return { page: 'home', section: page || null };
}

const Loading = () => <div className="center-note"><span className="loader" /></div>;

export default function App() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.page === 'admin') return <Suspense fallback={<Loading />}><AdminApp /></Suspense>;
  if (route.page === 'galaxy') return <Suspense fallback={<Loading />}><Explorer selected={route.selected} /></Suspense>;
  if (route.page === 'project') return <ProjectPage key={route.slug} slug={route.slug} />;
  return <Home section={route.section} />;
}
