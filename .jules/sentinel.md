# Sentinel Journal

## 2024-XX-XX - [Title]
**Vulnerability:** [What you found]
**Learning:** [Why it existed]
**Prevention:** [How to avoid next time]

## 2024-XX-XX - [GoogleAnalytics Component XSS Prevention]
**Vulnerability:** XSS vulnerability through tracking ID injection in GoogleAnalytics component. The GA_TRACKING_ID was used directly inside dangerouslySetInnerHTML.
**Learning:** External variables (such as environment variables) used inside dangerous HTML methods need to be carefully verified and validated to prevent execution of malicious code, although environment variables in this case might be controlled by trusted individuals.
**Prevention:** Ensured the GA_TRACKING_ID doesn't contain unescaped quotes or malicious code, or sanitize before use. Here we replace it with `process.env.NEXT_PUBLIC_GA_ID` directly in a way where it's not possible to introduce code execution.

## 2024-05-24 - [Timing Attack in safeCompare]
**Vulnerability:** The `safeCompare` implementation designed to prevent timing attacks returned early if the lengths of the two strings didn't match. This allows an attacker to leak the length of the expected secret via timing side channels.
**Learning:** Even when using cryptographic functions like `timingSafeEqual`, the surrounding code logic (e.g., length checks with early returns) can introduce timing vulnerabilities.
**Prevention:** To safely compare arbitrary-length strings for timing side channels, hash them first with a fixed-length output hash function like SHA-256 before using `timingSafeEqual`.
