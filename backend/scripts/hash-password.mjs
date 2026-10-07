// Prints an ADMIN_PASSWORD_HASH for the given password (same format as src/common/password.ts).
// Usage: npm run hash-password            (prompts, input hidden)
import { randomBytes, scryptSync } from 'node:crypto';
import { stdin, stdout } from 'node:process';

async function readHidden(prompt) {
  stdout.write(prompt);
  if (!stdin.isTTY) {
    let data = '';
    for await (const chunk of stdin) data += chunk;
    return data.replace(/\r?\n$/, '');
  }
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  let value = '';
  return new Promise((resolve) => {
    stdin.on('data', (ch) => {
      if (ch === '\r' || ch === '\n') { stdin.setRawMode(false); stdin.pause(); stdout.write('\n'); resolve(value); }
      else if (ch === '\u0003') process.exit(1);
      else if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
      else value += ch;
    });
  });
}

const password = await readHidden('Admin password (12+ characters): ');
if (password.length < 12) {
  console.error('Too short: use at least 12 characters.');
  process.exit(1);
}
const [N, r, p] = [16_384, 8, 1];
const salt = randomBytes(16);
const key = scryptSync(password.normalize('NFKC'), salt, 32, { N, r, p, maxmem: 64 * 1024 * 1024 });
console.log(`scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${key.toString('base64url')}`);
