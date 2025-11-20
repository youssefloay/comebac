# Security Review – Comebac

## Critical Missing Authentication
- `app/api/admin/create-coach-account/route.ts:21`  
  `app/api/admin/update-player-email/route.ts:6`  
  `app/api/admin/delete-account/route.ts:6`  
  `app/api/admin/reset-database/route.ts:1`  
  None of the admin routes verify that the caller is authenticated or authorized. Any unauthenticated user can create coach accounts, rewrite player emails, delete accounts, or wipe Firestore collections. Guard every handler with Firebase Admin token verification (`adminAuth.verifyIdToken`) and ensure the decoded role is `admin` before performing privileged logic.

## Profile Photo Upload Tampering
- `app/api/profile/upload-photo/route.ts:1`  
  `app/api/profile/upload-photo-client/route.ts:1`  
  Both endpoints accept `userId`/`userType` and blindly update matching documents, letting anyone overwrite another player or coach profile photo. They also access Storage/Firestore without checking the requester’s identity. Require a valid ID token, compare its `uid` with the target record (unless the caller is an admin), and reject unauthenticated calls.

## Email Normalization Bugs in Sign-up
- `lib/auth-context.tsx:317-407`  
  Addresses are lowercased into `normalizedEmail`, but every Firestore lookup and write still uses the original `sanitizedEmail`. Because Firestore string filters are case-sensitive, `Foo@Bar.com` can register again as `foo@bar.com`, bypassing duplicate checks and enabling multiple accounts per email. Use the normalized value for every query and stored field.

## Coach Pre-Provisioning Flow Breaks Registration
- `lib/auth-context.tsx:350-400`  
  The sign-up path always throws when the email exists in `coachAccounts`, so coaches invited via admin tooling (documents without a `uid`) can never finish self-service registration. Detect the “coach account exists but uid missing/mismatched” case and allow it to continue so the Firebase Auth user can be linked to the existing record.

## Oversized Base64 Avatars in Firestore
- `app/api/profile/upload-photo-client/route.ts:35-112`  
  Images are stored as `data:image/jpeg;base64,...` strings in Firestore documents. Even with a 900 KB raw limit, base64 inflation pushes many uploads beyond Firestore’s 1 MB document cap, causing intermittent failures. Move storage to Firebase Storage (like the admin upload does) and persist only the download URL, or lower the raw limit ~700 KB before encoding.

