# Installation

Follow these steps to install Living Characters in your AI Dungeon scenario.

---

## Step 1: Open Your Scenario

1. Go to your **Scenarios** page in AI Dungeon.
2. Find the scenario you want to use with Living Characters.
3. Click the **three dots (...)** on the scenario card.
4. Select **Edit**.

---

## Step 2: Open the Details Tab

1. In the scenario editor, click the **Details** tab at the top.
2. Scroll all the way to the bottom.

You will see a section called **Scripting**.

---

## Step 3: Enable Scripts

1. Turn on **Scripts Enabled**.
2. Click **Edit Scripts**.

This opens the AI Dungeon script editor.

---

## Step 4: Install the Living Characters Library

The easiest way is to copy the full script from the repo:

**https://raw.githubusercontent.com/LivingNarratives/LivingCharacters/main/library.js**

1. Go to the **Library** tab in the script editor.
2. Paste the entire contents of the file above.
3. Save your changes.

(You can also find the latest version and full documentation on the GitHub repo.)

---

## Step 5: Install the Context Modifier

1. Go to the **Context** tab.
2. Paste the following code:

```javascript
const modifier = (text) => {
    text = LivingCharacters("context", text);
    return { text };
};

modifier(text);
```

---

## Step 6: Install the Output Modifier

1. Go to the **Output** tab.
2. Paste the following code:

```javascript
const modifier = (text) => {
    text = LivingCharacters("output", text);
    return { text };
};

modifier(text);
```

---

## Step 7: (Optional) Install the Input Modifier

The Input modifier is optional but recommended for full functionality.

1. Go to the **Input** tab.
2. Paste the following code:

```javascript
const modifier = (text) => {
    text = LivingCharacters("input", text);
    return { text };
};

modifier(text);
```

---

## Step 8: Create the Configuration Story Card

Create a new Story Card with the exact name:

**LIVING CHARACTERS CONFIG**

This card controls important settings like:
- Character roster
- Pressures
- Life Card interval
- Target cooldown
- Maximum active Life Cards
- Scene relevance
- Optional relationship targeting

---

## Step 9: Configure Your Settings

Add your Life Card roster and settings to **LIVING CHARACTERS CONFIG**.

**Example:**
```
PROTAGONIST_NAME: Jessica

PROTAGONIST_INVOLVEMENT: normal

CHARACTERS:
Griff
Dominic
Winter
Charlotte
Ariel
Zephyr

LIFE_CARD_INTERVAL: 15
TARGET_COOLDOWN: 3
MAX_ACTIVE_CARDS: 2

SCENE_RELEVANCE_MODE: off

PRESSURES:
friendship
jealousy
rivalry
trust
curiosity
anger
protectiveness
avoidance
tension
```

**See the full list of Pressure Presets here:** https://LivingNarratives.github.io/LivingCharacters

If you are adding the roster in the Story Card **Notes** field, use a visible label so it is clear where the roster starts:

```
Characters:
Griff
Dominic
Winter
```

`Characters:` is a label, not a character name. Living Characters ignores it when reading the roster.

---

## Optional: Configure Relationships

Relationships use a separate Story Card named exactly:

**LIVING CHARACTERS RELATIONSHIPS**

Add relationship rules beneath the `Relationships:` heading:

```
Relationships:
Jessica>Sam=jealousy,attraction
Jessica > Sam = jealousy,attraction
```

If you do not include a pressure list, Living Characters uses the global pressure pool from **LIVING CHARACTERS CONFIG**.

The example section above `Relationships:` is documentation only.

Living Characters alternates between relationship owner selection and random owner selection. If one pool has no eligible owners, it automatically falls back to the other.

---

## Optional: Configure Thought Cards

Thought Cards use a separate Story Card named exactly:

**THOUGHT CARDS CONFIG**

Thought Cards are optional and off by default. They do not affect Life Cards and do not enter story context.

Recent thoughts stay in Entry. Older thoughts roll over into Notes, and the oldest archived Notes thoughts are trimmed when storage fills. The internal storage limit is 1700 characters for Entry and 1700 characters for Notes, leaving extra buffer space during rollover without shortening individual thoughts.

The 💭 marker shows the most recently updated Thought Card. Only one Thought Card should display 💭 at a time.

The latest script also improves Thought Card reliability so captured thoughts are filed to the correct character's card more consistently.

It also reduces repeated thoughts and improves handling for models that sometimes use pronouns instead of character names. No extra Thought Card setup is required.

Thought Cards are not compatible with AI Dungeon's Optimized Context feature.
Disable Optimized Context when using Thought Cards.

See [Configuration](./configuration.md) for the full Thought Cards setup example.

---

## Step 10: Start Playing

Start your scenario as normal.

Living Characters will automatically generate Life Cards that create:
- Friendships and rivalries
- Attraction and jealousy
- Arguments and trust-building
- Long-term relationship arcs
- Emergent character stories

No extra input is required from you. The characters will naturally develop their own relationships and storylines as you play.
