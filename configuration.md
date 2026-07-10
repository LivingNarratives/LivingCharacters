# Configuration Card Setup

Living Characters uses **two separate Story Cards**:

- **LIVING CHARACTERS CONFIG** = Life Cards
- **THOUGHT CARDS CONFIG** = Thought Cards

Keep these settings separate. Do not put Thought Card settings inside **LIVING CHARACTERS CONFIG**.

---

## LIVING CHARACTERS CONFIG = Life Cards

This card controls **Life Cards only**.

Create a Story Card named exactly:

**LIVING CHARACTERS CONFIG**

This card controls:

- `PROTAGONIST_NAME`
- `PROTAGONIST_INVOLVEMENT`
- `CHARACTERS` / roster
- `PRESSURES`
- `LIFE_CARD_INTERVAL`
- `TARGET_COOLDOWN`
- `MAX_ACTIVE_CARDS`
- `SCENE_RELEVANCE`

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

LIFE_CARD_INTERVAL: 15

TARGET_COOLDOWN: 3

MAX_ACTIVE_CARDS: 2

SCENE_RELEVANCE: off
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

## SCENE_RELEVANCE

Controls whether Life Cards must involve characters currently in the scene.

### Off
`SCENE_RELEVANCE: off`

Allows off-screen social development and world progression.

### Strict
`SCENE_RELEVANCE: strict`

Requires at least one character from the Life Card to be present in the current scene.

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
```

Turn `THOUGHTS_ENABLED` to `true` only when you want Thought Cards active.

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

Thought Cards now use stricter capture instructions and character labels so thoughts are filed to the correct character's card more reliably. This helps prevent rare cases where a thought could attach to the wrong person.

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
