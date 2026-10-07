import { useState } from 'react';
import { api } from '../lib/api';

export const slugify = (text) =>
  text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const EMPTY = {
  slug: '', title: '', summary: '', description: '', category: '', period: '', tags: [], highlights: [],
  repoUrl: '', demoUrl: '', imageId: null, imageUrl: null, color: '#2dd4bf', featured: false, published: true, sortOrder: 0,
};

export default function ProjectForm({ project, categories, onCancel, onSaved }) {
  const isNew = !project.id;
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...project,
    repoUrl: project.repoUrl ?? '',
    demoUrl: project.demoUrl ?? '',
    tagsText: (project.tags ?? []).join(', '),
    highlightsText: (project.highlights ?? []).join('\n'),
  }));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
    if (field === 'slug') setSlugTouched(true);
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return setError('Images are limited to 4 MB.');
    setUploading(true);
    setError(null);
    try {
      const { id, url } = await api.uploadImage(file);
      setForm((f) => ({ ...f, imageId: id, imageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const input = {
      slug: form.slug,
      title: form.title,
      summary: form.summary,
      description: form.description,
      category: form.category || 'Projects',
      period: form.period,
      tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      highlights: form.highlightsText.split('\n').map((t) => t.trim()).filter(Boolean),
      repoUrl: form.repoUrl,
      demoUrl: form.demoUrl,
      imageId: form.imageId,
      color: form.color,
      featured: form.featured,
      published: form.published,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (isNew) await api.createProject(input);
      else await api.updateProject(project.id, input);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="admin-toolbar">
        <h2>{isNew ? 'New project' : `Edit “${project.title}”`}</h2>
      </div>

      <div className="form-grid">
        <label className="span-2">Title<input value={form.title} onChange={set('title')} maxLength={120} required /></label>
        <label>Slug (URL)<input value={form.slug} onChange={set('slug')} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /></label>
        <label>
          Category
          <input value={form.category} onChange={set('category')} list="categories" maxLength={40} placeholder="Projects" />
          <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label>Period<input value={form.period} onChange={set('period')} maxLength={60} placeholder="e.g. Days 85–98, or 2026" /></label>
        <label>Order on its ring<input type="number" value={form.sortOrder} onChange={set('sortOrder')} min={-10000} max={10000} /></label>

        <label className="span-2">Summary <span className="muted">(one or two sentences, shown on cards)</span>
          <textarea value={form.summary} onChange={set('summary')} maxLength={400} rows={2} />
        </label>
        <label className="span-2">Description <span className="muted">(blank line between paragraphs)</span>
          <textarea value={form.description} onChange={set('description')} maxLength={20000} rows={7} />
        </label>
        <label className="span-2">Highlights <span className="muted">(one per line)</span>
          <textarea value={form.highlightsText} onChange={set('highlightsText')} rows={3} />
        </label>
        <label className="span-2">Tags <span className="muted">(comma-separated)</span>
          <input value={form.tagsText} onChange={set('tagsText')} placeholder="Airflow, dbt, Postgres" />
        </label>
        <label>Code URL<input type="url" value={form.repoUrl} onChange={set('repoUrl')} placeholder="https://github.com/…" /></label>
        <label>Demo URL<input type="url" value={form.demoUrl} onChange={set('demoUrl')} placeholder="https://…" /></label>

        <div className="span-2 image-field">
          <span className="field-label">Image</span>
          {form.imageUrl ? (
            <div className="image-preview">
              <img src={form.imageUrl} alt="" />
              <button type="button" className="btn small" onClick={() => setForm((f) => ({ ...f, imageId: null, imageUrl: null }))}>Remove</button>
            </div>
          ) : null}
          <label className="btn small file-btn">
            {uploading ? 'Uploading…' : form.imageUrl ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={uploading} hidden />
          </label>
          <span className="muted small">PNG, JPEG, WebP or GIF, up to 4 MB</span>
        </div>

        <div className="span-2 inline-fields">
          <label className="color-field">Planet colour<input type="color" value={form.color} onChange={set('color')} /></label>
          <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured (bigger planet with a ring)</label>
          <label className="check"><input type="checkbox" checked={form.published} onChange={set('published')} /> Published</label>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" disabled={busy || uploading}>{busy ? 'Saving…' : isNew ? 'Create project' : 'Save changes'}</button>
      </div>
    </form>
  );
}
