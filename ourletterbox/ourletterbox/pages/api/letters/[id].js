import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    if (data.opened_at && data.burn_after_reading) {
      return res.status(410).json({ error: 'This letter has already been opened and is gone.' });
    }

    if (data.unlock_at && new Date(data.unlock_at) > new Date()) {
      return res.status(423).json({ error: 'Not time yet', unlockAt: data.unlock_at });
    }

    return res.status(200).json({
      ciphertext: data.ciphertext,
      salt: data.salt,
      iv: data.iv,
      burnAfterReading: data.burn_after_reading,
      alreadyOpened: !!data.opened_at,
    });
  }

  if (req.method === 'PATCH') {
    // Called once the recipient successfully decrypts the letter,
    // so a burn-after-reading letter is gone for good.
    const { error } = await supabase
      .from('letters')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
