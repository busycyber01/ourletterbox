import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ciphertext, salt, iv, unlockAt, burnAfterReading } = req.body;

  if (!ciphertext || !salt || !iv) {
    return res.status(400).json({ error: 'Missing encrypted letter data' });
  }

  const { data, error } = await supabase
    .from('letters')
    .insert({
      ciphertext,
      salt,
      iv,
      unlock_at: unlockAt || null,
      burn_after_reading: !!burnAfterReading,
    })
    .select('id')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ id: data.id });
}
