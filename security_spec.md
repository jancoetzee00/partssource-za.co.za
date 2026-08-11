# Security Specification for Partssource ZA Firestore

## Data Invariants
1. A listing must belong to an authenticated seller (`sellerId == request.auth.uid`).
2. Public users can read listings and seller profiles.
3. Only the seller or creator can update/delete their own listing or seller profile.
4. Timestamps (`createdAt`) must be valid string timestamps or server time.

## Dirty Dozen Attack Vectors
1. Spoofed `sellerId`: User tries to post a listing with another user's `sellerId`.
2. Unauthenticated write: Anonymous user tries to create or modify a listing.
3. Junk field injection: Payload contains non-whitelisted keys (e.g., `isAdmin: true`).
4. Overly long string payload: Title or description exceeds max length.
5. Mutating immutable `sellerId`: User tries to update `sellerId` on an existing listing.
6. Arbitrary document deletion: User attempts to delete a listing created by another user.
7. Unverified email write attempt: Creating seller profile without authentic account.
8. Invalid price payload: Negative or string price input.
9. Malformed document ID injection: Passing invalid characters in path ID.
10. System field tampering: Overwriting `createdAt` timestamp during updates.
11. Mass collection list scraping bypass.
12. User profile impersonation: Writing to `/users/{userId}` where `userId != request.auth.uid`.
