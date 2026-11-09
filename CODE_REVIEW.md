# Security review

## Exposed credentials and environment configuration

The repository's root `README.md` lists email addresses for the admin, teacher, and student accounts alongside a shared plaintext password. The default-branch Git tree also tracks a root `.env` file. Together, these make account and environment credentials available to anyone who can read this public repository, and any secrets committed in `.env` remain in Git history even if the file is later edited.

### Impact

Anyone with repository access can reuse the published account password, and any credentials in the tracked environment file may be copied or used outside the intended deployment. This can expose attendance records and connected services, depending on the privileges of those accounts and keys.

### Recommended remediation

1. Immediately rotate the shared account password and every credential in the tracked `.env` file; treat historical values as compromised.
2. Remove passwords and private account addresses from `README.md`. Document only the supported setup process and use non-sensitive example values.
3. Remove `.env` from version control and add it to `.gitignore`; provide a `.env.example` containing variable names with empty or clearly fake values.
4. Review Git history and revoke/rotate any exposed credentials. If historical secret removal is warranted, coordinate a history rewrite with repository collaborators.
5. Replace shared plaintext account passwords with individually managed accounts and securely hashed authentication credentials.

### Evidence reviewed

- `README.md`, Authentication & Security: lists three account email addresses and a shared password.
- Root `.env` is a tracked blob in the `main` branch tree.
- `src/components/dashboard/QRCodeModal.tsx`: the attendance QR payload sets `expiresIn` to 180 seconds and refreshes after the countdown. This review does not recommend removing that expiry because the README describes the codes as time-sensitive.
