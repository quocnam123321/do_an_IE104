# Profile review — 28/11/2026

UI: shared profile dialogs and tokens, no new framework. Reuse profile-dialog for lecturer password form, neutral default avatar, inline validation, Escape/close, success dialog after persistence.

Sample identities remain Nguyen Minh Anh / 24520001 and Nguyen Van An / GV001, preserving project links. Personal contact numbers and lecturer academic details are illustrative; giangvien@example.com is not a verified UIT lecturer identity. Faculty/major naming follows UIT https://tuyensinh.uit.edu.vn/nganh-dao-tao/nganh-cong-nghe-thong-tin. No personal data of an unrelated real lecturer was assigned to the sample account.

Profile and avatars retain existing browser storage services, revision checks and error handling. Real Firebase profile sync was not added. Demo password changes are scoped by role to this browser, stored as PBKDF2 salt/hash and honored by subsequent demo sign-in. No plaintext passwords are persisted. Firebase email/password sessions reauthenticate and updatePassword; Google-only sessions explain that passwords are managed in Google. Firebase integration requires live account QA by the user; no real credentials were changed during review.

Tab counters beside navigation titles are visually hidden, including lecturer teaching/created tabs and invitation tabs. Counts inside progress/submission columns remain useful task data and are unchanged.
