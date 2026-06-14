// Generate a scrypt password hash for ADMIN_PASSWORD_HASH.
//   npm run hash-password -- 'your-strong-password'
// Must match src/lib/password.ts (scheme/params).
import { scryptSync, randomBytes } from 'node:crypto';

const pw = process.argv[2];
if (!pw) {
  console.error("Usage: npm run hash-password -- 'your-password'");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
console.log(`scrypt$${salt.toString('hex')}$${hash.toString('hex')}`);
