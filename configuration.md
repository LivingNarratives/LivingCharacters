# Configuration Card Setup

Living Characters uses **three separate Story Cards**:

- **LIVING CHARACTERS CONFIG** = Life Cards
- **LIVING CHARACTERS RELATIONSHIPS** = relationship targeting for Life Cards
- **THOUGHT CARDS CONFIG** = Thought Cards

Keep these settings separate. Do not put relationship targeting or Thought Card settings inside **LIVING CHARACTERS CONFIG**.

---

## LIVING CHARACTERS CONFIG = Life Cards

This card controls **Life Cards only**.

Living Characters automatically creates a Story Card named exactly:

**LIVING CHARACTERS CONFIG**

Open that existing card to edit:

- `PROTAGONIST_NAME`
- `PROTAGONIST_INVOLVEMENT`
- `CHARACTERS` / roster
- `PRESSURES`
- `WORLD_EVENTS`
- `LIFE_CARD_INTERVAL`
- `TARGET_COOLDOWN`
- `MAX_ACTIVE_CARDS`
- `SCENE_RELEVANCE_MODE`

Relationship targeting is configured separately in **LIVING CHARACTERS RELATIONSHIPS**.

Thought Cards are configured separately in **THOUGHT CARDS CONFIG**.

---

## Life Cards Quick Start Example

```
PROTAGONIST_NAME: Frank

PROTAGONIST_INVOLVEMENT: normal

CHARACTERS:
Alice
Bob
Charlie

PRESSURES:
friendship
jealousy
rivalry
trust
curiosity

WORLD_EVENTS:
A citywide blackout begins
A mysterious package arrives with no return address

LIFE_CARD_INTERVAL: 15

TARGET_COOLDOWN: 3

MAX_ACTIVE_CARDS: 2

SCENE_RELEVANCE_MODE: off
```

---

## PROTAGONIST_NAME

The name of the player's character.

This lets NPCs form relationships and Life Cards that involve the protagonist.

**Example:**
`PROTAGONIST_NAME: Frank`

---

## PROTAGONIST_INVOLVEMENT

Controls how often the protagonist is allowed to participate in Living Characters threads.

**Default:**
`PROTAGONIST_INVOLVEMENT: normal`

**Options:** `off | normal | high | always`

Use `normal` for most scenarios.

In second-person stories, the protagonist is often written as "you" instead of by name. Living Characters includes a built-in `YOU` fallback trigger for Life Card injection. If neither participant on an active Life Card has been referenced yet, the script can use the protagonist's `YOU` reference so the relevant Life Card is still injected into model context instead of waiting for one participant to be mentioned.

---

## CHARACTERS

A list of NPCs that will participate in the social simulation.

- One character per line
- Only include characters you want in the Living Characters system
- In the Story Card **Notes** field, use a clear label like `Characters:` above the list

The `Characters:` label is just there to help you see where the roster starts. It is a label, not a character name, and Living Characters ignores it when reading the roster.

**Example:**
```
CHARACTERS:
Alice
Bob
Charlie
```

---

## PRESSURES

Pressures are the social and emotional forces that drive Life Cards and drama.

You can use any pressures you like. The AI interprets them naturally in the story.

**Common examples:**
- friendship, trust, curiosity, protectiveness
- jealousy, rivalry, attraction, seduction, teasing
- anger, betrayal, guilt, envy, avoidance

**Example:**
```
PRESSURES:
friendship
jealousy
rivalry
trust
curiosity
```

---

## World Events

World Events are optional, autonomous developments that can change the wider story world without starting from a particular character. They can introduce unexpected story developments on their own, while the narrator decides which characters become involved and how the event unfolds.

Configure them under the `WORLD_EVENTS:` heading in the **Events Configuration** section of the existing **LIVING CHARACTERS CONFIG** Story Card.

### Available options

- Add one event per line beneath `WORLD_EVENTS:`.
- Write events in plain language; each line can describe any development appropriate for your story.
- Lines in parentheses are comments and are ignored.
- Leave the section empty to disable World Events.

**Example:**
```
WORLD_EVENTS:
A citywide blackout begins
A mysterious package arrives with no return address
A surprise festival fills the town square
```

**Western example:**
```
WORLD_EVENTS:
A gun duel erupts in the street
A brawl breaks out in the saloon
```

World Events interact with Life Cards by using the same active-card system. An active event takes one of the slots set by `MAX_ACTIVE_CARDS`, just like a Life Card. For example, with `MAX_ACTIVE_CARDS: 1`, a World Event is the only active card while it is in play; with `MAX_ACTIVE_CARDS: 2`, it can coexist with one character Life Card. Only one World Event can be active at a time.

World Events participate in the autonomous Life Card scheduling cycle. If no events are configured, event opportunities automatically fall through to the normal relationship or random Life Card pools, so existing Life Card behavior continues without interruption.

---

## LIFE_CARD_INTERVAL

How often the system tries to create new Life Cards.

**Recommended values:**
- `20` = Quiet / slower pacing
- `15` = Balanced
- `10` = Busy
- `5` = High chaos

**Example:**
`LIFE_CARD_INTERVAL: 15`

---

## TARGET_COOLDOWN

Prevents the same character from immediately generating another Life Card after creating one.

This helps distribute Life Cards more evenly across the cast and reduces the same character repeatedly being selected.

**Default:**
`TARGET_COOLDOWN: 3`

**Example:**
`TARGET_COOLDOWN: 3`

---

## MAX_ACTIVE_CARDS

Maximum number of active Life Cards at once.

**Simple recommendations:**
- `2` = Layered mode
- `1` = Focused mode

**Example:**
`MAX_ACTIVE_CARDS: 2`

---

## SCENE_RELEVANCE_MODE

Controls whether Life Cards must involve characters currently in the scene.

### Off (Recommended)
`SCENE_RELEVANCE_MODE: off`

Characters may generate Life Cards regardless of scene participation. This provides the most natural autonomous behavior and is the recommended setting for most adventures.

### Strict
`SCENE_RELEVANCE_MODE: strict`

Restricts Life Cards to characters participating in the current scene. This is recommended only for creators who specifically want scene-local interactions.

The older `SCENE_RELEVANCE` name is still accepted, but new examples use `SCENE_RELEVANCE_MODE`.

---

## Relationship Targeting

Relationship targeting is optional. It uses a separate Story Card named exactly:

**LIVING CHARACTERS RELATIONSHIPS**

Use this card when you want specific characters to generate Life Cards toward specific targets.

Relationship rules go beneath the `Relationships:` heading:

```
Relationships:
Luke>Larry
Luke > Larry

Luke>Larry=
Luke > Larry =

Luke>Larry=fight
Luke > Larry = fight

Luke>Larry=fight,yell,argue
Luke > Larry = fight,yell,argue
```

Spaces around `>` and `=` are optional.

These are equivalent:

```
Luke>Larry=fight
Luke > Larry = fight
```

If no pressure list is supplied, or `=` is left empty, Living Characters automatically uses the global default pressure list.

These all use the global default pressure list:

```
Luke>Larry
Luke>Larry=
Luke > Larry
Luke > Larry =
```

Multiple pressures are separated with commas.

Correct:

```
fight,yell,argue
```

Incorrect:

```
fight, yell, argue
```

Do not put spaces after commas in pressure lists.

Relationship rules are only read beneath the `Relationships:` heading. Anything above the heading is treated as documentation/examples and is ignored.

Unknown character names are handled safely. Relationship-only names can be used without duplicating them in the main roster.

---

## Round Robin Scheduling

Living Characters alternates owner selection between two systems:

- Relationship owner selection
- Random owner selection

On a relationship phase, Living Characters tries relationship owners first. If no relationship owner is eligible, it falls back to random owners.

On a random phase, Living Characters tries random owners first. If no random owner is eligible, it falls back to relationship owners.

The phase only advances after a Life Card is successfully created. Skipped turns, cooldowns, active card limits, or failed attempts do not advance the schedule.

This gives authored relationship cards and randomized Life Cards equal opportunities while still allowing graceful fallback when one pool has no eligible owners.


---

## THOUGHT CARDS CONFIG = Thought Cards

Thought Cards are optional, player-facing thought journals.

Create a separate Story Card named exactly:

**THOUGHT CARDS CONFIG**

Thought Cards are not compatible with AI Dungeon's Optimized Context feature.
Disable Optimized Context when using Thought Cards.

Thought Cards are off by default. They do not affect Life Cards, and they do not enter story context.

---

## Thought Cards Config Example

```
THOUGHTS_ENABLED: false

THOUGHT_CHARACTERS:
Characters:

THOUGHT_INTERVAL: 5

THOUGHT_FORMATION_CHANCE: 50

THOUGHT_SCENE_MODE: scene

THOUGHT_ORDER: ascending
```

Turn `THOUGHTS_ENABLED` to `true` only when you want Thought Cards active.

---

## THOUGHT_ORDER

Controls the display order of numbered thoughts on each Thought Card.

**Default:**
`THOUGHT_ORDER: ascending`

**Options:**

- `ascending` = `1,2,3,4` (oldest thought first)
- `descending` = `4,3,2,1` (newest thought first)

**Example:**
`THOUGHT_ORDER: descending`

This setting changes display order only. It does not change permanent thought numbers, storage order, Entry-to-Notes rollover, trimming, or any Life Card behavior.

---

## Thought Card History

Thought numbers are permanent. Thoughts no longer renumber after rollover, and Thought Cards have no fixed 10-thought cap anymore.

New thoughts stay in Entry. Older thoughts roll into Notes. Notes trims the oldest archived thoughts only when full.

Thought Card contents are still not injected into story context.

Thought Cards use an internal storage safety buffer:

- Entry keeps recent thoughts.
- Notes keeps older rolled-over thoughts.
- The internal Entry and Notes storage limit is 1700 characters each.
- The extra buffer space helps prevent rare long-thought bleed-over when storage is nearly full.
- Individual thought generation has not been shortened or limited. Long, natural thoughts are still supported.

The 💭 marker means "most recently updated." Living Characters scans Thought Cards and clears existing 💭 markers before marking the newest updated card. Only one Thought Card should display 💭 at a time.

Updated Thought Story Cards are deleted and recreated when saved. This keeps the most recently updated Thought Card near the top of AI Dungeon's Story Card list instead of drifting lower over time. No user configuration is required.

Thought Cards validate attribution against the intended character before saving. This prevents rare cases where a generated Thought could be assigned to the wrong character if the model returns an incorrect label.

Thoughts introduce characters by first name and then transition naturally to pronouns where appropriate. This keeps internal monologue clear without repeatedly using the character's name.

The latest Thought Card update also reduces repeated thoughts, especially on Gemma, and fixes Hearthfire cases where Thought Card content could bleed into the AI narrator's generated response. The script now strongly favors explicit character names over pronouns such as "he" or "she" when deciding where to file a thought.

---

## Thought Card Model Notes

Works with Optimized Context off:

- DeepSeek V4 Flash
- DeepSeek V4 Pro
- Equinox
- Gemma 4 31B

Not compatible with Thought Card workflow:

- Atlas
- Raven

Reason: Atlas and Raven are cache-style models.
