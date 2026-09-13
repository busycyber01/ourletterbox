// All encryption happens in the browser. The server / database only ever
// sees ciphertext — the passphrase and plaintext never leave the client.

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

async function deriveKey(passphrase, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Returns { ciphertext, salt, iv } all base64-encoded, safe to store in a DB.
export async function encryptLetter(plaintext, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufToBase64(ciphertextBuf),
    salt: bufToBase64(salt),
    iv: bufToBase64(iv),
  };
}

// Throws if the passphrase is wrong (AES-GCM auth tag won't verify).
export async function decryptLetter({ ciphertext, salt, iv }, passphrase) {
  const key = await deriveKey(passphrase, base64ToBuf(salt));
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuf(iv) },
    key,
    base64ToBuf(ciphertext)
  );
  return dec.decode(plaintextBuf);
}
