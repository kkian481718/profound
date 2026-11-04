## 2024-05-24 - [CRITICAL] Fixed length-leaking timing attack in safeCompare

**Vulnerability:** The \`safeCompare\` function in cron job API routes (\`cleanup-images/route.ts\` and \`close-stores/route.ts\`) returned early if the lengths of the provided strings did not match (\`if (aBuf.length !== bBuf.length) return false;\`). This early return allowed attackers to discover the length of the \`CRON_SECRET\` by measuring the response time, which defeated the purpose of using \`timingSafeEqual\`.

**Learning:** When comparing two arbitrary-length strings (where one is secret) using \`timingSafeEqual\`, returning early on a length mismatch leaks the secret's length. \`timingSafeEqual\` requires buffers of the same length and throws an error if they differ.

**Prevention:** To prevent length leaking while avoiding errors from \`timingSafeEqual\`, the recommended approach is to hash both inputs (e.g., using SHA-256) before comparison. This guarantees both inputs have the same length (the hash digest length) and securely compares them in constant time without leaking the original lengths.
