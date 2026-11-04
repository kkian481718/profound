## 2023-10-27 - [High] Fix Insecure File Upload Vulnerability
**Vulnerability:** The application allowed file uploads directly to Supabase storage without validating the file type or extension, only extracting the extension from the file name.
**Learning:** If users upload a malicious file (e.g., .svg or .html containing JavaScript), it can lead to Stored Cross-Site Scripting (XSS) when viewed, or be used to host malware.
**Prevention:** Always validate both the file extension and the MIME type (`image.type.startsWith("image/")`) before processing and uploading to a public storage bucket to prevent malicious file hosting and execution.
