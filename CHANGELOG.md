# Changelog

## 2.55 - Thought Card Clip Length Update

- Thought Card length can now be configured from the Thought Cards config card.
- `MAX_THOUGHT_LENGTH` accepts values from 60 to 400 characters.
- Values below 60 are raised to 60, and values above 400 are lowered to 400.
- The setting only limits individual Thought Card entries and does not change Life Card behavior.

## 2.54 - Thought Card Storage Update

- Thought numbers are now permanent.
- Thoughts no longer renumber after rollover.
- Thought Cards are no longer limited to 10 thoughts per character.
- New thoughts stay in Entry.
- Older thoughts roll into Notes.
- Notes trims the oldest archived thoughts only when full.
- Thought Card contents are still not injected into story context.
