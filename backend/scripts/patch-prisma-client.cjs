/**
 * Post-generate patch for the Prisma 7 generated client.
 *
 * The generated client.ts uses `import.meta.url` (ESM-only) to derive
 * __dirname. When NestJS compiles the app to CommonJS via SWC, import.meta is
 * invalid. Since CJS already provides __dirname natively, we strip the ESM
 * shim line so the generated client compiles cleanly under SWC→CJS.
 *
 * Run after every `prisma generate` (wired into prisma:generate script).
 */
const fs = require('fs');
const path = require('path');

const clientPath = path.resolve(__dirname, '..', 'src', 'generated', 'prisma', 'client.ts');

if (!fs.existsSync(clientPath)) {
  console.log('[patch] generated client not found, skipping');
  process.exit(0);
}

let src = fs.readFileSync(clientPath, 'utf8');

// Replace the ESM __dirname shim with a no-op (CJS provides __dirname already).
const before = src;
src = src.replace(
  /globalThis\[['"]__dirname['"]\]\s*=\s*path\.dirname\(fileURLToPath\(import\.meta\.url\)\)/,
  "/* __dirname patched for CJS (provided natively) */",
);

if (src.includes('import.meta')) {
  // Remove the now-unused node:url import.
  src = src.replace(/import\s*\{\s*fileURLToPath\s*\}\s*from\s*['"]node:url['"]\s*\n/, '');
}

if (src !== before) {
  fs.writeFileSync(clientPath, src);
  console.log('[patch] patched src/generated/prisma/client.ts for CJS');
} else {
  console.log('[patch] no changes needed (already patched or pattern not found)');
}
