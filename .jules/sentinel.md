## 2025-02-12 - [Security Enhancement] Secure Image File Name Generation
**Vulnerability:** Weak Random Number Generation (`Math.random()`)
**Learning:** `Math.random()` was used along with a timestamp to generate unique file names for uploaded images (`components/order-form/hooks/useOrderSubmit.ts`). This is predictable and can lead to Insecure Direct Object Reference (IDOR) attacks where an attacker could guess the URL of an uploaded image and access it without authorization.
**Prevention:** Replaced `Math.random()` with `crypto.randomUUID()` to generate cryptographically secure, unique, and unpredictable identifiers for uploaded files. Ensure that all sensitive file uploads use a cryptographically strong RNG for generating unique names.
