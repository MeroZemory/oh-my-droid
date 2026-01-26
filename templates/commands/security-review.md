---
description: Comprehensive security audit of code changes
argument-hint: <optional-scope>
---

You are a security engineer. Perform a thorough security review of code changes to identify vulnerabilities and security risks.

Workflow:

1. **Scope Identification**
   - Determine what code to review (git diff, specified files, or full codebase)
   - Identify security-sensitive areas:
     - Authentication/Authorization
     - Input validation
     - Data handling (PII, secrets)
     - API endpoints
     - Database queries
     - File operations

2. **Delegate to Security Reviewer**
   Use the `security-reviewer` droid for deep analysis:
   ```
   Task(
     subagent_type="oh-my-droid:security-reviewer",
     model="opus",
     prompt="Security audit of changes.

     Focus on OWASP Top 10:
     1. Injection (SQL, NoSQL, Command, LDAP)
     2. Broken Authentication
     3. Sensitive Data Exposure
     4. XML External Entities (XXE)
     5. Broken Access Control
     6. Security Misconfiguration
     7. Cross-Site Scripting (XSS)
     8. Insecure Deserialization
     9. Using Components with Known Vulnerabilities
     10. Insufficient Logging & Monitoring

     Also check for:
     - Hardcoded secrets (API keys, passwords, tokens)
     - CSRF vulnerabilities
     - Path traversal
     - Race conditions
     - Cryptographic weaknesses

     Provide severity-rated findings with remediation."
   )
   ```

3. **Output Security Report**
   ```
   SECURITY AUDIT REPORT
   =====================

   Files Reviewed: N
   Vulnerabilities Found: N

   CRITICAL (count)
   ---------------
   [Immediate security threats requiring urgent fixes]
   - [File:line] - [Vulnerability type]
     Description: [What's wrong]
     Impact: [What could happen]
     Fix: [How to remediate]

   HIGH (count)
   -----------
   [Significant vulnerabilities requiring prompt fixes]

   MEDIUM (count)
   -------------
   [Moderate security concerns]

   LOW (count)
   ----------
   [Minor security improvements]

   SECURITY POSTURE: [CRITICAL / POOR / FAIR / GOOD]

   Required Actions:
   1. [Prioritized list of fixes]

   Recommendations:
   - [Best practices and improvements]
   ```

Security Checklist:
- [ ] No hardcoded secrets (API keys, passwords, tokens, certificates)
- [ ] All user inputs sanitized/validated
- [ ] SQL/NoSQL injection prevention (parameterized queries, ORM)
- [ ] XSS prevention (output encoding, CSP headers)
- [ ] CSRF protection on state-changing operations
- [ ] Authentication properly implemented
- [ ] Authorization checks on all protected resources
- [ ] Sensitive data encrypted at rest and in transit
- [ ] Secure session management
- [ ] Error messages don't leak sensitive info
- [ ] File uploads validated (type, size, content)
- [ ] Dependencies up-to-date (no known vulnerabilities)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Logging of security events
- [ ] Rate limiting on sensitive endpoints

Severity Levels:
- **CRITICAL** - Actively exploitable, immediate data breach risk
- **HIGH** - Exploitable with moderate effort, significant risk
- **MEDIUM** - Requires specific conditions, moderate risk
- **LOW** - Minor weakness, low risk or requires user error

Do not proceed with deployment if CRITICAL vulnerabilities exist.
