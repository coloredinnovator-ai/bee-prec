# Data Collection and Verification

This document tracks member data collection for BEE COOP. All collection requires explicit consent and authenticated access.

## Profiles

Collection: `profiles/{uid}`

Fields:
- `uid` (string)
- `displayName` (string)
- `handle` (string, optional)
- `organization` (string, optional)
- `location` (string, optional)
- `website` (string, optional)
- `bio` (string, optional)
- `avatarUrl` (string, optional)
- `avatarPath` (string, optional)
- `visibility` (`members` | `public`)
- `offlineAccessRequested` (bool)
- `matchingOptIn` (bool)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

Profile photos are stored in Storage at `profiles/{uid}/...`.

## Identity Verification

Collection: `identityVerifications/{uid}`

Fields:
- `uid` (string)
- `legalName` (string)
- `idType` (`drivers-license` | `passport` | `state-id` | `other`)
- `documentUrl` (string)
- `documentPath` (string)
- `documentName` (string, optional)
- `status` (`pending` | `verified` | `rejected`)
- `consent` (bool, must be true)
- `submittedAt` (timestamp)
- `updatedAt` (timestamp)
- `reviewedBy` (string, optional)
- `reviewedAt` (timestamp, optional)

Identity documents are stored in Storage at `identity/{uid}/...` and are readable only by the uploader and verified staff roles.

## Access Control

See:
- `/Users/user1/Desktop/BEE-PREC/firestore.rules`
- `/Users/user1/Desktop/BEE-PREC/storage.rules`

## Notes

- No automated decisions are made based on ID data; verification is manual.
- Upload limits: profile photos 2MB, ID documents 5MB.
