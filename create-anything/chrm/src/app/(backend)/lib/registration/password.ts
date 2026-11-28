// lib/registration/password.ts
// Registration passwords are never stored in plaintext. They are bcrypt-hashed
// when the registration form is submitted, kept on the pending payment row as
// `password_hash`, and handed to Supabase (auth.admin.createUser({ password_hash }))
// once payment is confirmed. After that the hash is removed from the row too.
import bcrypt from "bcryptjs";

const BCRYPT_COST = 10;

export function hashRegistrationPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Returns payment metadata with any password material removed from registration_data. */
export function stripRegistrationSecrets<T extends Record<string, any> | null | undefined>(metadata: T): T {
  if (!metadata?.registration_data) return metadata;
  const { password: _password, password_hash: _hash, ...rest } = metadata.registration_data;
  return { ...metadata, registration_data: rest };
}
