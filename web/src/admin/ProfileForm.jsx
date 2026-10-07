import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const NULLABLE = ['githubUrl', 'linkedinUrl', 'contactEmail', 'photoUrl', 'cvUrl'];

export default function ProfileForm() {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    api.profile().then((p) => {
      const f = { ...p, languagesText: (p.languages ?? []).join('\n') };
      for (const k of NULLABLE) f[k] = p[k] ?? '';
      setForm(f);
    }).catch((e) => setError(e.message));
  }, []);

  if (!form) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const set = (field) => (e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setStatus(null); };

  const upload = (field, accept) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return setError('Files are limited to 4 MB.');
    setUploading(field);
    setError(null);
    try {
      const { url } = accept === 'pdf' ? await api.uploadFile(file) : await api.uploadImage(file);
      setForm((f) => ({ ...f, [field]: url }));
      setStatus('Uploaded: click Save profile to publish it');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const { languagesText, ...rest } = form;
    try {
      await api.updateProfile({
        name: rest.name, title: rest.title, headline: rest.headline, bio: rest.bio, location: rest.location, availability: rest.availability,
        languages: languagesText.split('\n').map((s) => s.trim()).filter(Boolean),
        ...Object.fromEntries(NULLABLE.map((k) => [k, rest[k]])),
      });
      setStatus('Saved');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="admin-toolbar"><h2>Profile</h2><span className="muted">Hero, About and Contact sections</span></div>
      <div className="form-grid">
        <label>Full name<input value={form.name} onChange={set('name')} maxLength={80} required /></label>
        <label>Job title<input value={form.title} onChange={set('title')} maxLength={80} placeholder="AI & Data Engineer" /></label>
        <label className="span-2">Pitch <span className="muted">(one sentence under your name)</span>
          <input value={form.headline} onChange={set('headline')} maxLength={160} />
        </label>
        <label className="span-2">About <span className="muted">(blank line between paragraphs)</span>
          <textarea value={form.bio} onChange={set('bio')} maxLength={4000} rows={8} />
        </label>
        <label>Location<input value={form.location} onChange={set('location')} maxLength={80} /></label>
        <label>Availability<input value={form.availability} onChange={set('availability')} maxLength={160} /></label>
        <label className="span-2">Languages <span className="muted">(one per line)</span>
          <textarea value={form.languagesText} onChange={set('languagesText')} rows={3} />
        </label>
        <label>Public email<input type="email" value={form.contactEmail} onChange={set('contactEmail')} /></label>
        <label>LinkedIn URL<input type="url" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://www.linkedin.com/in/…" /></label>
        <label>GitHub URL<input type="url" value={form.githubUrl} onChange={set('githubUrl')} /></label>

        <div className="image-field">
          <span className="field-label">Photo</span>
          {form.photoUrl && <img className="avatar-preview" src={form.photoUrl} alt="" />}
          <label className="btn small file-btn">
            {uploading === 'photoUrl' ? 'Uploading…' : form.photoUrl ? 'Replace photo' : 'Upload photo'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload('photoUrl', 'image')} disabled={!!uploading} hidden />
          </label>
        </div>
        <div className="image-field span-2">
          <span className="field-label">CV (PDF)</span>
          {form.cvUrl ? <a href={form.cvUrl} download>Current CV</a> : <span className="muted small">No CV yet: the Download CV buttons stay hidden.</span>}
          <div className="inline-fields">
            <label className="btn small file-btn">
              {uploading === 'cvUrl' ? 'Uploading…' : form.cvUrl ? 'Replace CV' : 'Upload CV'}
              <input type="file" accept="application/pdf" onChange={upload('cvUrl', 'pdf')} disabled={!!uploading} hidden />
            </label>
            {form.cvUrl && <button type="button" className="btn small" onClick={() => setForm((f) => ({ ...f, cvUrl: '' }))}>Remove</button>}
          </div>
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {status && <span className="saved">{status}</span>}
        <button className="btn primary" disabled={!!uploading}>Save profile</button>
      </div>
    </form>
  );
}
