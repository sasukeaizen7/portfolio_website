import { useEffect, useState } from 'react';
import { api } from './api';

// Everything the public pages show, fetched once per page load and shared between routes.
let cache = null;

export function useSite() {
  const [state, setState] = useState(() => (cache ? { data: cache, error: null } : { data: null, error: null }));

  useEffect(() => {
    if (cache) return;
    let live = true;
    Promise.all([api.profile(), api.projects(), api.experiences(), api.skills()])
      .then(([profile, projects, experiences, skills]) => {
        cache = { profile, projects, experiences, skills };
        if (live) setState({ data: cache, error: null });
      })
      .catch((e) => live && setState({ data: null, error: e.message }));
    return () => { live = false; };
  }, []);

  return state;
}

// Featured first, then by category and order: the order used everywhere on the site.
export function sortProjects(projects) {
  return [...projects].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export const paragraphs = (text) => (text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
