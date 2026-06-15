# Configuration Card Setup

Living Characters is controlled through a **Story Card** named exactly:

**LIVING CHARACTERS CONFIG**

Create a new Story Card with that name in your AI Dungeon game.

---

## Quick Start Example

```
PROTAGONIST_NAME: Frank

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

---

## PROTAGONIST_NAME

The name of the player’s character.

This lets NPCs form relationships and Life Cards that involve the protagonist.

**Example:**
`PROTAGONIST_NAME: Frank`

---

## CHARACTERS

A list of NPCs that will participate in the social simulation.

- One character per line
- Only include characters you want in the Living Characters system

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

**Recommendations by model:**
- Dynamic Large: `2`
- Hearthfire: `1` (Hearthfire focuses better on fewer active threads)

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

Better for Hearthfire, Gemma, and models that benefit from tighter focus.
