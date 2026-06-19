# Configuration Card Setup

Living Characters is controlled through a **Story Card** named exactly:

**LIVING CHARACTERS CONFIG**

Create a new Story Card with that name in your AI Dungeon game.

---

## Thought Card Compatibility Warning

Thought Cards are not compatible with AI Dungeon's Optimized Context feature.
Disable Optimized Context when using Thought Cards.

---

## Quick Start Example

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

MAX_ACTIVE_CARDS: 2

SCENE_RELEVANCE: off
```

If your version includes Thought Cards, their history is hard-limited to 10 thoughts per character. Oldest thoughts are trimmed automatically. You do not choose the thought count.

For best results, keep model notes general and focus on settings. Current findings:

- Dynamic Large works with Optimized Context off
- DeepSeek V4 Flash works with Optimized Context off
- DeepSeek V4 Pro works with Optimized Context off
- Equinox works with Optimized Context off
- Gemma 4 31B works with Optimized Context off
- Atlas and Raven are cache-style models and are not compatible with the Thought Card workflow

---

## PROTAGONIST_NAME

The name of the player’s character.

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

---

## CHARACTERS

A list of NPCs that will participate in the social simulation.

- One character per line
- Only include characters you want in the Living Characters system
- In the Story Card **Notes** field, use a clear label like `Characters:` above the list
- Do not put `Characters:` on its own character line unless you actually want that text treated as a name

The label is just there to help you see where the roster starts.

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
- `15` = Balanced (recommended for most models)
- `10` = Busy
- `5` = High chaos

**Example:**
`LIFE_CARD_INTERVAL: 15`

---

## MAX_ACTIVE_CARDS

Maximum number of active Life Cards at once.

**Simple recommendations:**
- Dynamic Large: `2`
- Models that benefit from tighter focus: `1`

**Example:**
`MAX_ACTIVE_CARDS: 2`

---

## SCENE_RELEVANCE

Controls whether Life Cards must involve characters currently in the scene.

### Off (Recommended for most models)
`SCENE_RELEVANCE: off`

Allows off-screen social development and world progression.

### Strict
`SCENE_RELEVANCE: strict`

Requires at least one character from the Life Card to be present in the current scene.

Better for models that benefit from tighter focus.

---

## Thought Card History

Thought Card history is limited to 10 thoughts per character. When a character has more than 10 thoughts, the oldest thoughts are trimmed automatically. The thought count is fixed and is not chosen by the user.
