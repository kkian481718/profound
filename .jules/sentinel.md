## 2024-05-18 - [CRITICAL] Length-leaking Timing Attack in `timingSafeEqual`

**Vulnerability:** The application was vulnerable to length-leaking timing attacks when comparing strings like `CRON_SECRET`. This occurred because the `safeCompare` implementation converted strings to byte arrays and returned early if their lengths did not match, before passing them to `timingSafeEqual`. This allows attackers to discover the expected length of a secret.

**Learning:** `timingSafeEqual` throws an error (or behaves insecurely in custom wrappers) when given buffers of different lengths. A naive fix is checking length and returning false if they mismatch, which defeats the point by leaking the length. A better approach is hashing both inputs with a secure hash algorithm (like SHA-256) which normalizes the output lengths, and then using `timingSafeEqual` on the resulting hashes. This entirely masks the length of the secret input.

**Prevention:** When comparing secrets (like API keys, tokens, webhooks, or cron secrets), never return early based on string length. Always use the hash-and-compare pattern: `crypto.timingSafeEqual(new Uint8Array(crypto.createHash('sha256').update(inputA).digest()), new Uint8Array(crypto.createHash('sha256').update(inputB).digest()))`.
