import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Color Palette
const PALETTE = {
  primary: '#1976d2',
  accent: '#ffca28',
  secondary: '#424242',
  background: '#ffffff',
  backgroundSidebar: '#f7f8fa',
  text: '#282c34',
};

function uuid4() {
  // Simple browser-compatible UUID generator for local storage
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Sidebar navigation options - for future extension
const NAV_ITEMS = [{ key: 'notes', label: 'My Notes', icon: '📝' }];

// PUBLIC_INTERFACE
function App() {
  // State for notes list, search, filter, and editing
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 750);
  const [theme /* see App.css for light theme */] = useState('light');

  const titleInputRef = useRef(null);

  // Load notes from localStorage at startup
  useEffect(() => {
    const localNotes = JSON.parse(window.localStorage.getItem('notes__list') || '[]');
    setNotes(localNotes);
  }, []);

  // Persist notes to localStorage when they change
  useEffect(() => {
    window.localStorage.setItem('notes__list', JSON.stringify(notes));
  }, [notes]);

  // Ensure sidebar follows window size
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 750);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get currently selected note object
  const selectedNote =
    notes.find(n => n.id === selectedNoteId) || null;

  // Filtered notes for search list
  const filteredNotes = notes
    .filter(note =>
      (note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // PUBLIC_INTERFACE
  function handleCreateNote() {
    const id = uuid4();
    const now = new Date().toISOString();
    const newNote = {
      id,
      title: 'Untitled',
      content: '',
      created_at: now,
      updated_at: now,
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(id);
    // Next render: focus input
    setTimeout(() => titleInputRef.current && titleInputRef.current.focus(), 150);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (window.confirm('Delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNoteId === id) setSelectedNoteId(null);
    }
  }

  // PUBLIC_INTERFACE
  function handleUpdateNote(id, patch) {
    setNotes(notes =>
      notes.map(note =>
        note.id === id
          ? { ...note, ...patch, updated_at: new Date().toISOString() }
          : note
      )
    );
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedNoteId(id);
  }

  // Get a preview (first line, fallback to "No Content")
  function notePreviewContent(note) {
    if (!note.content.trim()) return <em style={{ color: '#aaa' }}>No content</em>;
    return (
      <span>
        {note.content
          .replace(/\n/g, ' ')
          .slice(0, 60)}
        {note.content.length > 60 ? ' ...' : ''}
      </span>
    );
  }

  // Styling helpers
  function classNames(...a) {
    return a.filter(Boolean).join(' ');
  }

  // Layout
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: PALETTE.background,
      color: PALETTE.text,
      fontFamily: 'system-ui, Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 270 : 0,
          background: PALETTE.backgroundSidebar,
          color: PALETTE.secondary,
          borderRight: `1px solid #ececec`,
          boxShadow: sidebarOpen
            ? '2px 0px 6px rgba(60,60,60,0.03)'
            : 'none',
          transition: 'width 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s',
          overflow: 'hidden',
          minWidth: 0,
          zIndex: 2,
        }}>
        <div style={{
          padding: '1.9rem 1.2rem 1.2rem 1.2rem',
          borderBottom: '1px solid #ececec',
          fontWeight: 600,
          fontSize: '1.16rem',
          color: PALETTE.primary,
          letterSpacing: '0.07em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>
            <span role="img" aria-label="logo">📝</span> Notes
          </span>
          <button
            aria-label="Collapse sidebar"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              color: PALETTE.secondary,
              cursor: 'pointer',
              display: window.innerWidth < 800 ? 'block' : 'none',
              marginLeft: 8
            }}
            title="Close sidebar"
          >←</button>
        </div>
        <div style={{ padding: '1.2rem', borderBottom: '1px solid #f1f1f1' }}>
          <button
            onClick={handleCreateNote}
            style={{
              background: PALETTE.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '9px 17px',
              fontWeight: 500,
              fontSize: '1rem',
              boxShadow: `0 2px 6px #153d71${'18'}`,
              cursor: 'pointer',
              marginBottom: 20,
              transition: 'background 0.2s'
            }}>
            ＋ New Note
          </button>
          <input
            type="search"
            placeholder="Search notes..."
            aria-label="Search notes"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '0.57rem 1rem',
              fontSize: '1rem',
              border: '1px solid #dadada',
              borderRadius: 6,
              width: '100%',
              background: '#fff',
              color: PALETTE.secondary,
              outline: 'none',
              marginBottom: 12
            }}
          />
        </div>
        {/* Notes list */}
        <nav style={{ overflowY: 'auto', height: 'calc(100vh - 210px)' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ color: '#b3b3b3', padding: '2.4rem 1.3rem 1rem' }}>
              {notes.length === 0 && !search
                ? "No notes yet. Create your first note!"
                : "No matching notes found."}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={classNames(
                  'note-list-item',
                  selectedNoteId === note.id && 'selected'
                )}
                style={{
                  padding: '0.92rem 1.4rem 0.92rem 1.3rem',
                  background: selectedNoteId === note.id ? '#e3eaf5' : undefined,
                  borderBottom: '1px solid #f3f3f9',
                  cursor: 'pointer',
                  fontWeight: selectedNoteId === note.id ? 600 : 400,
                  color: PALETTE.secondary,
                  position: 'relative'
                }}
                title={note.title}
                onClick={() => handleSelectNote(note.id)}
              >
                <div style={{
                  fontSize: '1.07rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    color: selectedNoteId === note.id ? PALETTE.primary : PALETTE.secondary
                  }}>{note.title || 'Untitled'}</span>
                  <button
                    tabIndex={-1}
                    className="delete-btn"
                    title="Delete note"
                    aria-label="Delete note"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e74c3c',
                      cursor: 'pointer',
                      fontSize: '1.05rem',
                      opacity: 0.74,
                      marginLeft: 12
                    }}
                  >✕</button>
                </div>
                <div style={{
                  fontSize: '0.95rem',
                  color: '#888',
                  margin: '3px 0 0',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {notePreviewContent(note)}
                </div>
              </div>
            ))
          )}
        </nav>
      </aside>
      {/* Main Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          minWidth: 0,
        }}
      >
        {/* "Hamburger" open button (if sidebar is closed/mobile) */}
        {!sidebarOpen && (
          <button
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: PALETTE.backgroundSidebar,
              border: '1px solid #ececec',
              borderRadius: 7,
              color: PALETTE.secondary,
              fontSize: '1.35rem',
              padding: '8px 16px',
              margin: '14px',
              alignSelf: 'flex-start'
            }}>
            ☰
          </button>
        )}
        {/* No note selected */}
        {!selectedNote ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#b2b2b2',
            letterSpacing: '0.03em',
            textAlign: 'center',
            padding: '2.8rem'
          }}>
            <h2 style={{ color: PALETTE.primary, fontSize: '2rem', fontWeight: 700 }}>
              {notes.length === 0
                ? "Welcome to Notes!"
                : "Select a Note"}
            </h2>
            <p style={{
              fontSize: '1.23rem',
              color: '#aaa',
              margin: '14px 0 34px'
            }}>
              {notes.length === 0
                ? "Click '＋ New Note' on the left to begin."
                : "Pick a note from the sidebar or create a new one."}
            </p>
          </div>
        ) : (
          <NoteEditor
            note={selectedNote}
            onUpdateNote={handleUpdateNote}
            titleInputRef={titleInputRef}
          />
        )}
        <footer style={{
          marginTop: 'auto',
          padding: '1.2rem 2rem 0.7rem',
          fontSize: '0.97rem',
          color: '#bfbfbf',
          letterSpacing: '0.01em',
          opacity: 0.8
        }}>
          Personal Notes Manager – 
          <span style={{ color: PALETTE.accent, fontWeight: 500 }}>Modern React Demo</span>
        </footer>
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onUpdateNote, titleInputRef }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  // Update local state if props.note changes (when navigating between notes)
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  // Handle updating note live
  function handleTitleChange(e) {
    setTitle(e.target.value);
    onUpdateNote(note.id, { title: e.target.value });
  }
  function handleContentChange(e) {
    setContent(e.target.value);
    onUpdateNote(note.id, { content: e.target.value });
  }

  return (
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '2.7rem max(2vw,2.2rem) 1.1rem',
      fontSize: '1.15rem'
    }}>
      <input
        ref={titleInputRef}
        value={title}
        onChange={handleTitleChange}
        className="note-title-input"
        placeholder="Title"
        maxLength={70}
        spellCheck={true}
        aria-label="Note Title"
        style={{
          fontSize: '2.05rem',
          fontWeight: 700,
          border: 'none',
          marginBottom: '1.3rem',
          color: PALETTE.primary,
          outline: 'none',
          background: 'none'
        }}
      />
      <textarea
        value={content}
        onChange={handleContentChange}
        className="note-content-input"
        placeholder="Type your note here..."
        aria-label="Note Content"
        spellCheck={true}
        rows={13}
        style={{
          fontSize: '1.13rem',
          border: '1px solid #e1e1e1',
          borderRadius: 7,
          padding: '1.1rem',
          minHeight: '35vh',
          resize: 'vertical',
          background: '#fcfcfc',
          color: '#343434',
          fontWeight: 400,
          marginBottom: '2.4rem',
          boxSizing: 'border-box',
          lineHeight: 1.55
        }}
      />
      <div style={{ fontSize: '0.98rem', color: '#ababab', marginTop: 8 }}>
        Last edit:{' '}
        <span title={note.updated_at}>
          {new Date(note.updated_at).toLocaleString()}
        </span>
      </div>
    </section>
  );
}

export default App;
