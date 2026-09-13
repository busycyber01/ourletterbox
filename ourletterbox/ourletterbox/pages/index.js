import { useState } from 'react';
import { encryptLetter } from '../lib/crypto';

export default function Home() {
  const [text, setText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [burnAfterReading, setBurnAfterReading] = useState(true);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSeal(e) {
    e.preventDefault();
    setError('');

    if (!text.trim() || !passphrase.trim()) {
      setError('Write your letter and set a passphrase first.');
      return;
    }

    setLoading(true);
    try {
      const encrypted = await encryptLetter(text, passphrase);

      const res = await fetch('/api/letters/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...encrypted,
          unlockAt: unlockAt ? new Date(unlockAt).toISOString() : null,
          burnAfterReading,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      const url = `${window.location.origin}/letter/${data.id}`;
      setLink(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (link) {
    return (
      <div className="paper">
        <h1>OurLetterBox</h1>
        <p className="subtitle">Your letter is sealed and ready to send.</p>
        <div className="link-box">{link}</div>
        <p className="muted" style={{ marginTop: 16 }}>
          Send this link to them, and give them the passphrase separately —
          a different way, in person, or a channel only the two of you share.
          Without it, the letter can&apos;t be opened, not even by you.
        </p>
        <button style={{ marginTop: 20 }} onClick={() => setLink('')}>
          Write another
        </button>
      </div>
    );
  }

  return (
    <form className="paper" onSubmit={handleSeal}>
      <p className="muted" style={{ marginBottom: 4 }}>OurLetterBox</p>
      <h1>Write your letter</h1>
      <p className="subtitle">Every word here is encrypted before it ever leaves your browser.</p>

      <textarea
        placeholder="Dear..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <label style={{ marginTop: 20 }}>Passphrase (share this separately)</label>
      <input
        type="password"
        placeholder="Something only they'd know"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />

      <label>Unlock at (optional — leave blank to open anytime)</label>
      <input
        type="datetime-local"
        value={unlockAt}
        onChange={(e) => setUnlockAt(e.target.value)}
      />

      <div className="checkbox-row">
        <input
          type="checkbox"
          id="burn"
          checked={burnAfterReading}
          onChange={(e) => setBurnAfterReading(e.target.checked)}
        />
        <label htmlFor="burn" style={{ margin: 0, textTransform: 'none', fontSize: '0.95rem' }}>
          Letter disappears after it&apos;s opened once
        </label>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Sealing...' : 'Seal the letter'}
      </button>
    </form>
  );
}
