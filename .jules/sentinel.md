## 2025-02-28 - Insecure Random Number Generation

**Vulnerability:** Weak random number generation (`Math.random()`) was being used for generating file names for uploaded images in `components/order-form/hooks/useOrderSubmit.ts`.
**Learning:** `Math.random()` is not cryptographically secure, and using it for things like file names or identifiers introduces collision risk or potential predictability.
**Prevention:** Avoid `Math.random()` for unique identifiers or tokens. Instead, use cryptographically secure primitives like `crypto.randomUUID()` when a globally unique identifier is required.
