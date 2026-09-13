import { useState } from 'react';
import { useRouter } from 'next/router';
import { decryptLetter } from '../../lib/crypto';

export default function LetterPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stage, setStage] = useState('sealed'); // sealed -> passphrase -> revealed
  const [passphrase, setPassphrase] = useState('');
  const [letterText, setLetterText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    </div>
  );
}
