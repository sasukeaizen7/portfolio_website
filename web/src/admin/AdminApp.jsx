import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import ExperienceAdmin from './ExperienceAdmin';
import ProfileForm from './ProfileForm';
import ProjectForm from './ProjectForm';
import SkillsAdmin from './SkillsAdmin';

export default function AdminApp() {
  const [admin, setAdmin] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    document.title = 'Admin · Portfolio';
    api.me().then(setAdmin).catch(() => setAdmin(null));
  }, []);

  if (admin === undefined) return <div className="center-note">Loading…</div>;
  if (!admin) return <Login onSignedIn={setAdmin} />;
  return <Dashboard admin={admin} onSignedOut={() => setAdmin(null)} />;
}

function Login({ onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await api.login(email, password));
    } catch (err) {
      setError(err.status === 429 ? 'Too many attempts. Wait a minute and try again.' : err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin login-page">
      <form className="login" onSubmit={submit}>
        <h1>Admin</h1>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="#/" className="muted-link">← Back to the portfolio</a>
      </form>
    </div>
  );
}

function Dashboard({ admin, onSignedOut }) {
  const [tab, setTab] = useState('profile');
  const [projects, setProjects] = useState(null);
  const [editing, setEditing] = useState(null); // a project, {} for a new one, or null
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api.adminProjects().then(setProjects).catch((e) => (e.status === 401 ? onSignedOut() : setError(e.message)));
  }, [onSignedOut]);
  useEffect(load, [load]);

  const signOut = async () => {
    await api.logout().catch(() => {});
    onSignedOut();
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}”? This can’t be undone.`)) return;
    try {
      await api.deleteProject(p.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const togglePublished = async (p) => {
    try {
      await api.updateProject(p.id, { published: !p.published });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const categories = [...new Set((projects ?? []).map((p) => p.category))];

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>Portfolio admin</h1>
        <nav className="toggle">
          {[['profile', 'Profile'], ['experience', 'Experience'], ['skills', 'Skills'], ['projects', 'Projects']].map(([id, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setEditing(null); }}>{label}</button>
          ))}
        </nav>
        <span className="grow" />
        <a className="btn" href="#/">View site</a>
        <span className="muted">{admin.email}</span>
        <button className="btn" onClick={signOut}>Sign out</button>
      </header>

      {error && <p className="error" role="alert" onClick={() => setError(null)}>{error}</p>}

      {tab === 'profile' && <ProfileForm />}
      {tab === 'experience' && <ExperienceAdmin onAuthError={onSignedOut} />}
      {tab === 'skills' && <SkillsAdmin />}

      {tab === 'projects' && (editing ? (
        <ProjectForm
          project={editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      ) : (
        <section>
          <div className="admin-toolbar">
            <h2>{projects ? `${projects.length} projects` : 'Projects'}</h2>
            <button className="btn primary" onClick={() => setEditing({})}>+ New project</button>
          </div>
          {!projects ? <p className="muted">Loading…</p> : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th /><th>Title</th><th>Category</th><th>Order</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className={p.published ? '' : 'draft'}>
                      <td><span className="swatch" style={{ background: p.color }} /></td>
                      <td>
                        <button className="link" onClick={() => setEditing(p)}>{p.title}</button>
                        {p.featured && <span className="badge">featured</span>}
                        <div className="muted small">{p.slug}</div>
                      </td>
                      <td>{p.category}</td>
                      <td>{p.sortOrder}</td>
                      <td>
                        <button className={`status ${p.published ? 'live' : ''}`} onClick={() => togglePublished(p)} title="Click to toggle">
                          {p.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="row-actions">
                        {p.published && <a className="btn small" href={`#/p/${p.slug}`}>View</a>}
                        <button className="btn small" onClick={() => setEditing(p)}>Edit</button>
                        <button className="btn small danger" onClick={() => remove(p)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
