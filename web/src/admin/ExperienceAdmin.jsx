import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

const KINDS = [
  ['work', 'Experience'],
  ['education', 'Education'],
  ['certification', 'Certifications'],
];

const EMPTY = { kind: 'work', title: '', organization: '', location: '', startLabel: '', endLabel: '', summary: '', highlights: [], tags: [], url: '', published: true, sortOrder: 0 };

// Work experience, education and certifications: the CV sections of the home page.
export default function ExperienceAdmin({ onAuthError }) {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api.adminExperiences().then(setItems).catch((e) => (e.status === 401 ? onAuthError() : setError(e.message)));
  }, [onAuthError]);
  useEffect(load, [load]);

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This can’t be undone.`)) return;
    try {
      await api.deleteExperience(item.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (editing) return <ExperienceForm item={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;

  return (
    <section>
      {error && <p className="error" role="alert">{error}</p>}
      {!items ? <p className="muted">Loading…</p> : KINDS.map(([kind, label]) => {
        const list = items.filter((i) => i.kind === kind);
        return (
          <div key={kind} className="admin-group">
            <div className="admin-toolbar">
              <h2>{label} <span className="muted">({list.length})</span></h2>
              <button className="btn primary small" onClick={() => setEditing({ ...EMPTY, kind, sortOrder: list.length + 1 })}>+ Add</button>
            </div>
            {list.length === 0 ? <p className="muted">Nothing yet.</p> : (
              <div className="table-wrap">
                <table className="admin-table">
                  <tbody>
                    {list.map((i) => (
                      <tr key={i.id} className={i.published ? '' : 'draft'}>
                        <td>
                          <button className="link" onClick={() => setEditing(i)}>{i.title}</button>
                          <div className="muted small">{[i.organization, [i.startLabel, i.endLabel].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}</div>
                        </td>
                        <td className="muted small">#{i.sortOrder}{!i.published && ' · hidden'}</td>
                        <td className="row-actions">
                          <button className="btn small" onClick={() => setEditing(i)}>Edit</button>
                          <button className="btn small danger" onClick={() => remove(i)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function ExperienceForm({ item, onCancel, onSaved }) {
  const isNew = !item.id;
  const [form, setForm] = useState(() => ({
    ...EMPTY, ...item, url: item.url ?? '',
    highlightsText: (item.highlights ?? []).join('\n'),
    tagsText: (item.tags ?? []).join(', '),
  }));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const input = {
      kind: form.kind, title: form.title, organization: form.organization, location: form.location,
      startLabel: form.startLabel, endLabel: form.endLabel, summary: form.summary, url: form.url,
      highlights: form.highlightsText.split('\n').map((s) => s.trim()).filter(Boolean),
      tags: form.tagsText.split(',').map((s) => s.trim()).filter(Boolean),
      published: form.published, sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (isNew) await api.createExperience(input);
      else await api.updateExperience(item.id, input);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="admin-toolbar"><h2>{isNew ? 'Add entry' : `Edit “${item.title}”`}</h2></div>
      <div className="form-grid">
        <label>Section
          <select value={form.kind} onChange={set('kind')}>
            {KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label>Order<input type="number" value={form.sortOrder} onChange={set('sortOrder')} /></label>
        <label className="span-2">{form.kind === 'work' ? 'Role' : form.kind === 'education' ? 'Degree' : 'Certification'}
          <input value={form.title} onChange={set('title')} maxLength={160} required />
        </label>
        <label>{form.kind === 'work' ? 'Company' : form.kind === 'education' ? 'School' : 'Issuer'}
          <input value={form.organization} onChange={set('organization')} maxLength={160} />
        </label>
        <label>Location<input value={form.location} onChange={set('location')} maxLength={80} placeholder="Paris, France" /></label>
        <label>Start<input value={form.startLabel} onChange={set('startLabel')} maxLength={40} placeholder="Jan 2026" /></label>
        <label>End<input value={form.endLabel} onChange={set('endLabel')} maxLength={40} placeholder="Present" /></label>
        <label className="span-2">Summary<textarea value={form.summary} onChange={set('summary')} maxLength={1000} rows={2} /></label>
        <label className="span-2">Achievements <span className="muted">(one per line)</span>
          <textarea value={form.highlightsText} onChange={set('highlightsText')} rows={5} />
        </label>
        <label className="span-2">Technologies <span className="muted">(comma-separated)</span>
          <input value={form.tagsText} onChange={set('tagsText')} placeholder="Python, PyTorch, OpenCV" />
        </label>
        <label>Link <span className="muted">(certificate, company…)</span><input type="url" value={form.url} onChange={set('url')} placeholder="https://…" /></label>
        <label className="check"><input type="checkbox" checked={form.published} onChange={set('published')} /> Shown on the site</label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}
