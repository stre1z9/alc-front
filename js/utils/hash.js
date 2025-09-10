
export async function sha256Base64(input) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);

  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export async function sha256WithSaltBase64(password, salt) {
  return sha256Base64(`${salt}:${password}`);
}
