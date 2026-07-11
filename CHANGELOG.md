# Changelog

## 2.60 - Relationships and Scheduling Update

- Added relationship targeting with the new **LIVING CHARACTERS RELATIONSHIPS** Story Card.
- Added flexible relationship syntax such as `Luke>Larry`, `Luke > Larry`, `Luke>Larry=`, `Luke > Larry =`, `Luke>Larry=fight`, `Luke > Larry = fight`, `Luke>Larry=fight,yell,argue`, and `Luke > Larry = fight,yell,argue`.
- Added optional spacing around `>` and `=`.
- Empty or omitted pressure lists automatically use the global default pressure list.
- Relationship rules are entered beneath the `Relationships:` heading. Example text above that heading is documentation only.
- Added round robin owner scheduling that alternates between relationship owner selection and random owner selection.
- Added automatic fallback between relationship and random owner pools when one pool has no eligible owners.
- Scene Relevance now defaults to `off`.
- Updated setup and configuration docs for the current Life Cards, Relationships, and Thought Cards cards.

## 2.59 - Thought Cards Quality and Trigger Update

### Fixed

- Fixed Thought Card content occasionally bleeding into the AI narrator's generated response on Hearthfire. This is confirmed fixed on Hearthfire and may also improve behavior on other supported models.
- Fixed excessive Thought Card repetition, particularly on Gemma, where repeated thoughts were most noticeable.
- Fixed Thought Card attribution so thoughts now preferentially attach to the correct character name instead of falling back to pronouns such as "he" or "she." Pronouns may still appear in some edge cases due to model output, but the script now strongly favors explicit character names.

### Added

- Added a fallback trigger for `YOU` to improve Life Card injection. If neither participant on an active Life Card has been referenced yet, the script can use the protagonist's `YOU` reference as a reliable fallback so the relevant Life Card is still injected into model context instead of waiting for one participant to be mentioned. No additional trigger configuration is required.

## 2.58 - Thought Cards Reliability Update

- Fixed Thought Cards so captured thoughts are written to the correct character's Thought Card instead of occasionally attaching to the wrong person.
- Improved Thought Card instruction wording to be more forceful, improving compliance across more AI models.
- Added another empty-response safeguard to further reduce blank narrator responses after hidden/private output is stripped.
- Fixed narrator response formatting so returned story text keeps the needed spacing.

## 2.57 - Thought Cards Maintenance Update

- Reduced the internal Thought Card Entry and Notes storage limit from 1900 to 1700 characters.
- This adds buffer space during Entry -> Notes rollover and helps prevent rare long-thought bleed-over when storage is nearly full.
- Individual thought generation has not been shortened or limited. Long, natural thoughts are still supported.
- Improved the Thought Card 💭 "most recently updated" marker logic.
- The system now scans all Thought Cards and clears existing 💭 markers before marking the newest updated card.
- Only one Thought Card should display 💭 at a time.

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
