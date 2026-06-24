# Changelog

## 2.56 - Empty Response Fallback Fix

- Fixed: Added a zero-width Unicode fallback for stripped/empty outputs to reduce AI Dungeon empty response errors, especially seen during Nova testing.
- Replaced the previous normal-space fallback because AI Dungeon can still treat trimmed whitespace as empty.
- Existing hidden/private output stripping behavior is unchanged.

## 2.55 - Thought Card Clipping Rollback

- Rolled back the configurable Thought Card clipping / `MAX_THOUGHT_LENGTH` update.
- Removed the 60-400 character clipping setting from the public docs.
- Restored the previous Thought Card storage behavior from 2.54.

## 2.54 - Thought Card Storage Update

- Thought numbers are now permanent.
- Thoughts no longer renumber after rollover.
- Thought Cards have no fixed 10-thought cap anymore.
- New thoughts stay in Entry.
- Older thoughts roll into Notes.
- Notes trims the oldest archived thoughts only when full.
- Thought Card contents are still not injected into story context.
