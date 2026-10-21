import { useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'cloud-notes-cca-v1';
const INITIAL_NOTES = [
  {
    id: 'welcome-note',
    title: 'Welcome to Cloud Notes',
    body: 'Add a note, refresh the page, and see that it stays in this browser. This demo needs no backend or database.',
    category: 'Getting started',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cicd-note',
    title: 'CCA CI/CD checklist',
    body: 'Push code to GitHub → Jenkins builds the Docker image → ECR stores it → Kubernetes rolls out the new version.',
    category: 'CI/CD',
    updatedAt: new Date().toISOString(),
  },
];

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('Could not read saved notes; using starter notes.', error);
  }
  return INITIAL_NOTES;
}

function prettyDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function App() {
  const [notes, setNotes] = useState(loadNotes);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Personal');
  const [notice, setNotice] = useState('Your notes are saved in this browser.');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      setNotice('Browser storage is unavailable. Your latest changes may not persist.');
      console.error(error);
    }
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) =>
      `${note.title} ${note.body} ${note.category}`.toLowerCase().includes(query),
    );
  }, [notes, search]);

  function resetForm() {
    setSelectedId(null);
    setTitle('');
    setBody('');
    setCategory('Personal');
  }

  function selectNote(note) {
    setSelectedId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setCategory(note.category);
  }

  function saveNote(event) {
    event.preventDefault();
    if (!title.trim()) {
      setNotice('Enter a title before saving.');
      return;
    }
    const now = new Date().toISOString();
    if (selectedId) {
      setNotes((current) => current.map((note) =>
        note.id === selectedId
          ? { ...note, title: title.trim(), body: body.trim(), category, updatedAt: now }
          : note,
      ));
      setNotice('Note updated successfully.');
    } else {
      const note = {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        title: title.trim(),
        body: body.trim(),
        category,
        updatedAt: now,
      };
      setNotes((current) => [note, ...current]);
      setSelectedId(note.id);
      setNotice('New note created successfully.');
    }
  }

  function deleteNote(id) {
    setNotes((current) => current.filter((note) => note.id !== id));
    if (selectedId === id) resetForm();
    setNotice('Note deleted.');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Cloud Notes home">
          <span className="brand-mark">N</span>
          <span>Cloud Notes <small>FRONTEND LAB</small></span>
        </a>
        <div className="pipeline-status"><span className="status-dot" /> CI/CD DEMO · VERSION 1.0</div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">YOUR IDEAS, IN ONE PLACE</p>
          <h1>Make room for<br /><span>great ideas.</span></h1>
          <p className="hero-description">A lightweight notes workspace built with React. Create, search, edit and delete notes, all without a backend service.</p>
          <div className="hero-tags"><span>React + Vite</span><span>Browser storage</span><span>Docker ready</span></div>
        </div>
        <div className="hero-card" aria-label="Notes summary">
          <div className="hero-card-heading"><span>YOUR WORKSPACE</span><span className="sparkle">✳</span></div>
          <div className="stat-number">{notes.length.toString().padStart(2, '0')}</div>
          <div className="stat-label">notes in your workspace</div>
          <div className="mini-bars"><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="hero-card-footer"><span>LOCAL-FIRST</span><span>● SAVED</span></div>
        </div>
      </section>

      <section className="workspace">
        <div className="notes-column">
          <div className="section-heading">
            <div><p className="eyebrow">YOUR SPACE</p><h2>All notes <span className="count-pill">{filteredNotes.length}</span></h2></div>
            <button className="button button-primary" onClick={resetForm} type="button">＋ New note</button>
          </div>
          <label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your notes..." aria-label="Search notes" /></label>
          <div className="notes-list">
            {filteredNotes.map((note) => (
              <article className={`note-card ${selectedId === note.id ? 'note-card-active' : ''}`} key={note.id}>
                <button className="note-select" type="button" onClick={() => selectNote(note)}>
                  <div className="note-card-top"><span className="category-label">{note.category}</span><span className="note-date">{prettyDate(note.updatedAt)}</span></div>
                  <h3>{note.title}</h3>
                  <p>{note.body || 'No additional details yet.'}</p>
                </button>
                <button className="delete-button" type="button" aria-label={`Delete ${note.title}`} onClick={() => deleteNote(note.id)}>×</button>
              </article>
            ))}
            {filteredNotes.length === 0 && <div className="empty-state"><span>✳</span><h3>No notes found</h3><p>Try another search or start a new note.</p></div>}
          </div>
        </div>

        <aside className="editor-panel">
          <div className="editor-heading"><div><p className="eyebrow">EDITOR</p><h2>{selectedId ? 'Edit a note' : 'Create a note'}</h2></div><span className="editor-icon">✎</span></div>
          <form onSubmit={saveNote}>
            <label className="field-label" htmlFor="note-title">Title</label>
            <input id="note-title" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your note a name" maxLength={100} />
            <label className="field-label" htmlFor="note-category">Category</label>
            <select id="note-category" className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}><option>Personal</option><option>Study</option><option>Ideas</option><option>CI/CD</option><option>Getting started</option></select>
            <label className="field-label" htmlFor="note-body">Your thoughts</label>
            <textarea id="note-body" className="form-input textarea" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write something worth remembering..." rows={7} />
            <button className="button button-primary save-button" type="submit">{selectedId ? 'Save changes' : 'Create note'} <span>→</span></button>
            <button className="button button-quiet" type="button" onClick={resetForm}>Clear editor</button>
          </form>
          <p className="notice" role="status">{notice}</p>
          <div className="privacy-note"><span>⌑</span><p><strong>Private by design</strong><br />Notes are stored locally in this browser. No RDS or backend required.</p></div>
        </aside>
      </section>

      <footer className="footer"><span>CRAFTED FOR THE CLOUD COMPUTING & DEVOPS LAB</span><span>BUILD · SHIP · LEARN <b>✳</b></span></footer>
    </main>
  );
}
