## 2025-02-20 - Insecure Filename Generation using Math.random()
**Vulnerability:** Predictable file names for uploaded images because of `Math.random()`.
**Learning:** `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG), leading to potential prediction of uploaded file URLs (IDOR/enumeration).
**Prevention:** Use `crypto.randomUUID()` in the browser to ensure filenames are completely unpredictable and secure.
