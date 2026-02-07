# Security Audit & Recommendations

## Identified Risks

### 1. Plaintext Password Storage (High Risk)
**Issue:** The system currently stores Mikrotik Router passwords and Subscriber PPPoE passwords in plaintext in the MongoDB database.
**Impact:** If the database is compromised, all router credentials and subscriber internet access credentials are exposed.
**Current Mitigation:**
*   API endpoints have been patched to *mask* these passwords in responses, preventing them from leaking to the frontend client.
*   Access to these endpoints requires 'admin' role.

### 2. API Exposure
**Issue:** Previously, `GET /api/routers` returned the full router object including passwords.
**Resolution:** This has been fixed by excluding the `password` field from the Mongoose query result (`.select('-password')`).

## Recommendations for Future Improvements

### 1. Encrypt Stored Passwords
**Recommendation:** Implement reversible encryption (e.g., AES-256) for fields that need to be sent to external services (Mikrotik).
*   Use a strong `ENCRYPTION_KEY` stored in environment variables (not in code).
*   Encrypt: `Router.password`, `Subscriber.pppoePassword`.
*   Decrypt only when communicating with the RouterOS API.

### 2. Implement "Soft Disconnect" via Profiles
**Recommendation:** Instead of disabling PPPoE secrets (which cuts connection entirely), switch users to a "Restricted" profile.
*   Create a "PaymentReminder" profile in Mikrotik with limited bandwidth and a redirect rule.
*   Update BayadNet to change the `profile` property instead of `disabled`.

### 3. Rate Limiting & Logging
**Recommendation:** Ensure all administrative actions (changing settings, toggling internet) are logged audit-style to a separate collection.
