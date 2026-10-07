import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

// Skill groups, edited inline: a name and a comma-separated list per group.
export default function SkillsAdmin() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api.skills().then(setGroups).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const add = async () => {
    try {
      await api.createSkillGroup({ name: 'New group', items: [], sortOrder: (groups?.length ?? 0) + 1 });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section>
      <div className="admin-toolbar">
        <h2>Skills <span className="muted">({groups?.length ?? 0} groups)</span></h2>
        <button className="btn primary small" onClick={add}>+ Add group</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {!groups ? <p className="muted">Loading…</p> : groups.map((g) => <SkillGroupRow key={g.id} group={g} onChanged={load} onError={setError} />)}
    </section>
  );
}

function SkillGroupRow({ group, onChanged, onError }) {
  const [name, setName] = useState(group.name);
  const [items, setItems] = useState(group.items.join(', '));
  const [order, setOrder] = useState(group.sortOrder);
  const [saved, setSaved] = useState(false);
  const dirty = name !== group.name || items !== group.items.join(', ') || Number(order) !== group.sortOrder;

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.updateSkillGroup(group.id, { name, items: items.split(',').map((s) => s.trim()).filter(Boolean), sortOrder: Number(order) || 0 });
      setSaved(true);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete the “${group.name}” group?`)) return;
    try {
      await api.deleteSkillGroup(group.id);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <form className="skill-row" onSubmit={save} onChange={() => setSaved(false)}>
      <input className="skill-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required aria-label="Group name" />
      <input className="skill-items" value={items} onChange={(e) => setItems(e.target.value)} aria-label="Skills, comma-separated" />
      <input className="skill-order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Order" />
      <button className="btn small primary" disabled={!dirty}>{saved && !dirty ? 'Saved' : 'Save'}</button>
      <button type="button" className="btn small danger" onClick={remove}>Delete</button>
    </form>
  );
}
