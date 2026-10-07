import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function ProfileForm() {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.profile().then((p) => setForm({ ...p, githubUrl: p.githubUrl ?? '', linkedinUrl: p.linkedinUrl ?? '', contactEmail: p.contactEmail ?? '' }))
      .catch((e) => setError(e.message));
  }, []);

  if (!form) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const set = (field) => (e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setStatus(null); };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.updateProfile(form);
      setStatus('Saved');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="admin-toolbar"><h2>Profile</h2><span className="muted">Shown on the central star and the About panel</span></div>
      <div className="form-grid">
        <label>Name<input value={form.name} onChange={set('name')} maxLength={80} required /></label>
        <label>Headline<input value={form.headline} onChange={set('headline')} maxLength={160} /></label>
        <label className="span-2">Bio <span className="muted">(blank line between paragraphs)</span>
          <textarea value={form.bio} onChange={set('bio')} maxLength={2000} rows={5} />
        </label>
        <label>GitHub URL<input type="url" value={form.githubUrl} onChange={set('githubUrl')} /></label>
        <label>LinkedIn URL<input type="url" value={form.linkedinUrl} onChange={set('linkedinUrl')} /></label>
        <label>Public contact email <span className="muted">(optional, shown publicly)</span><input type="email" value={form.contactEmail} onChange={set('contactEmail')} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {status && <span className="saved">{status}</span>}
        <button className="btn primary">Save profile</button>
      </div>
    </form>
  );
}
