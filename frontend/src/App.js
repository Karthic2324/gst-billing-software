import React, { useState } from 'react';
import InvoiceApp from './InvoiceApp';
import InvoiceHistory from './InvoiceHistory';
import Login from './Login';
import { isAuthenticated, removeToken, getUser } from './auth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [view, setView] = useState('BILLING');
  const user = getUser();

  const handleLogout = () => {
    removeToken();
    setAuthed(false);
  };

  if (!authed) {
    return <Login BASE_URL={BASE_URL} onLoginSuccess={() => setAuthed(true)} />;
  }

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 28px', background: '#001c2c', color: '#fff', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div>
          <strong style={{ fontSize: '18px', color: '#f5f115' }}>Om Muruga Auto Electrical Works </strong>
          {user?.username && <span style={{ marginLeft: '12px', fontSize: '13px', opacity: 0.85 }}>| User: <em>{user.username}</em></span>}
        </div>
        <div>
          <button
            onClick={() => setView('BILLING')}
            style={{ ...navBtn, background: view === 'BILLING' ? '#173a4e' : 'transparent', color: view === 'BILLING' ? '#38bdf8' : '#fff' }}
          >
            + New Invoice
          </button>
          <button
            onClick={() => setView('HISTORY')}
            style={{ ...navBtn, background: view === 'HISTORY' ? '#334155' : 'transparent', color: view === 'HISTORY' ? '#38bdf8' : '#fff' }}
          >
            Invoice History
          </button>
          <button onClick={handleLogout} style={{ ...navBtn, background: '#ef4444', marginLeft: '16px' }}>
            Logout
          </button>
        </div>
      </header>

      <main>
        {view === 'BILLING' ? (
          <InvoiceApp BASE_URL={BASE_URL} />
        ) : (
          <InvoiceHistory BASE_URL={BASE_URL} onBack={() => setView('BILLING')} />
        )}
      </main>
    </div>
  );
}

const navBtn = {
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  marginLeft: '6px',
  fontWeight: '600',
  fontSize: '13px'
};

export default App;