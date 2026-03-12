# Data Collection and Verification

This document tracks the website-era data model after the Next.js reset. Public and authenticated writes now flow through server handlers using Firebase Admin, with audit events recorded for intake, posting, and staff views.

## Public intake collections

### `clinicSignups/{id}`

- `name`
- `email`
- `emailLower`
- `organization`
- `location`
- `stage`
- `helpType`
- `preferredContact`
- `description`
- `consent`
- `status`
- `source`
- `createdAt`
- `updatedAt`

### `incidentReports/{id}`

- `title`
- `category`
- `priority`
- `businessName`
- `location`
- `body`
- `occurredAt`
- `anonymous`
- `reporterAlias`
- `reporterEmail`
- `reportedBy`
- `status`
- `hasAttachment`
- `attachmentPath`
- `attachmentUrl`
- `source`
- `createdAt`
- `updatedAt`
- `deleted`

Evidence uploads remain stored in Storage under `incidents/{uid-or-public}/{reportId}/...`.

## Member collections

### `users/{uid}`

- `uid`
- `email`
- `displayName`
- `role`
- `deleted`
- `createdAt`
- `updatedAt`

### `profiles/{uid}`

- `uid`
- `displayName`
- `handle`
- `organization`
- `location`
- `website`
- `bio`
- `focusAreas`
- `avatarUrl`
- `avatarPath`
- `verified`
- `verifiedAt`
- `visibility`
- `offlineAccessRequested`
- `matchingOptIn`
- `createdAt`
- `updatedAt`

### `communityPosts/{id}`

- `title`
- `body`
- `createdBy`
- `authorName`
- `flags`
- `removed`
- `createdAt`
- `updatedAt`

### `communityComments/{id}`

- `postId`
- `body`
- `createdBy`
- `authorName`
- `createdAt`
- `deleted`

### `matchRequests/{id}`

- `fromUid`
- `toUid`
- `fromName`
- `toName`
- `message`
- `status`
- `createdAt`
- `updatedAt`

## Staff and operations collections

### `identityVerifications/{uid}`

- `uid`
- `legalName`
- `idType`
- `documentUrl`
- `documentPath`
- `documentName`
- `status`
- `consent`
- `submittedAt`
- `updatedAt`
- `reviewedBy`
- `reviewedAt`

### `deletionRequests/{id}`

- `requesterId`
- `requesterAlias`
- `requesterEmail`
- `reason`
- `status`
- `requestedAt`
- `updatedAt`
- `updatedBy`
- `reviewedAt`
- `reviewedBy`

### `auditEvents/{id}`

- `eventType`
- `actorType`
- `actorId`
- `actorEmail`
- `targetCollection`
- `targetId`
- `status`
- `detail`
- `ipAddress`
- `userAgent`
- `createdAt`

### `backupRuns/{id}`

- `status`
- `summary`
- `firestoreBucket`
- `firestoreObject`
- `storageBucket`
- `storageObject`
- `createdAt`

## Access control

See:

- [firestore.rules](/Users/user1/Desktop/BEE-PREC/firestore.rules)
- [storage.rules](/Users/user1/Desktop/BEE-PREC/storage.rules)

## Notes

- No automated decisions are made from identity data; verification remains manual.
- Public writes are validated server-side before they touch Firestore or Storage.
- Profile photos are still capped at 2MB; identity files and incident evidence remain capped at 5MB.
