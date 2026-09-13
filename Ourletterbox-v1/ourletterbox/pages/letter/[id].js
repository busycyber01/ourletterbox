import { useState } from 'react';
import { useRouter } from 'next/router';
import { decryptLetter, encryptLetter } from '../../lib/crypto';

export default function LetterPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stage, setStage] = useState('sealed'); // sealed -> passphrase -> revealed
  const [passphrase, setPassphrase] = useState('');
  const [letterText, setLetterText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyPassphrase, setReplyPassphrase] = useState('');
  const [replyLink, setReplyLink] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');

  async function breakSeal() {
    setStage('passphrase');
  }

  async function handleOpen(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/letters/${id}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 423) {
          setError(`This letter unlocks on ${new Date(data.unlockAt).toLocaleString()}.`);
        } else {
          setError(data.error || 'This letter could not be found.');
        }
        setLoading(false);
        return;
      }

      const plaintext = await decryptLetter(data, passphrase);
      setLetterText(plaintext);
      setStage('revealed');

      if (data.burnAfterReading) {
        fetch(`/api/letters/${id}`, { method: 'PATCH' }).catch(() => {});
      }
    } catch (err) {
      setError('Wrong passphrase, or the letter is corrupted.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply(e) {
    e.preventDefault();
    setReplyError('');

    if (!replyText.trim() || !replyPassphrase.trim()) {
      setReplyError('Write something and set a passphrase first.');
      return;
    }

    setReplyLoading(true);
    try {
      const encrypted = await encryptLetter(replyText, replyPassphrase);

      const res = await fetch('/api/letters/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...encrypted,
          burnAfterReading: true,
          replyTo: id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      setReplyLink(`${window.location.origin}/letter/${data.id}`);
    } catch (err) {
      setReplyError(err.message);
    } finally {
      setReplyLoading(false);
    }
  }

  if (stage === 'sealed') {
    return (
      <div className="paper seal-wrap">
        <h1>A letter has arrived.</h1>
        <button className="wax-seal" onClick={breakSeal} aria-label="Break the seal">
          &#10084;
        </button>
        <p className="muted">Click the seal to break it open.</p>
      </div>
    );
  }

  if (stage === 'passphrase') {
    return (
      <form className="paper" onSubmit={handleOpen}>
        <h1>Enter the passphrase</h1>
        <p className="subtitle">Only the two of you know this.</p>
        <input
          type="password"
          placeholder="Passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Opening...' : 'Open the letter'}
        </button>
      </form>
    );
  }

  return (
    <div className="paper">
      <h1>Your letter</h1>
      <div className="letter-body">{letterText}</div>

      {!showReplyForm && !replyLink && (
        <button style={{ marginTop: 28 }} onClick={() => setShowReplyForm(true)}>
          Write a reply
        </button>
      )}

      {showReplyForm && !replyLink && (
        <form onSubmit={handleSendReply} style={{ marginTop: 28 }}>
          <label>Your reply</label>
          <textarea
            placeholder="Dear..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <label style={{ marginTop: 16 }}>Passphrase (share this separately)</label>
          <input
            type="password"
            placeholder="Something only they'd know"
            value={replyPassphrase}
            onChange={(e) => setReplyPassphrase(e.target.value)}
          />
          {replyError && <p className="error-text">{replyError}</p>}
          <button type="submit" disabled={replyLoading}>
            {replyLoading ? 'Sealing...' : 'Seal the reply'}
          </button>
        </form>
      )}

      {replyLink && (
        <div style={{ marginTop: 28 }}>
          <p className="subtitle">Your reply is sealed.</p>
          <div className="link-box">{replyLink}</div>
          <p className="muted" style={{ marginTop: 16 }}>
            Send this link back to them, and share the passphrase separately.
          </p>
        </div>
      )}
    </div>
  );
}
