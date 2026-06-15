# Installation

## Step 1: Open Your Scenario

1. Go to your **Scenarios** page in AI Dungeon.
2. Find the scenario you want to use with Living Characters.
3. Click the **three dots (...)** on the scenario card.
4. Click **Edit**.

---

## Step 2: Open the Details Tab

1. Click the **Details** tab at the top of the scenario editor.
2. Scroll all the way to the bottom of the page.

You should see a section called:

**Scripting**

---

## Step 3: Enable Scripts

1. Turn on **Scripts Enabled**.
2. Click **Edit Scripts**.

This will open the AI Dungeon script editor.

---

## Step 4: Install the Living Characters Library

1. Open the **Library** tab.
2. Copy the entire Living Characters library script.
3. Paste it into the Library section.
4. Save your changes.

---

## Step 5: Install the Context Modifier

Open the **Context** tab and paste:

```javascript
const modifier = (text) => {
    text = LivingCharacters("context", text);
    return { text };
};

modifier(text);
```

---

## Step 6: Install the Output Modifier

Open the **Output** tab and paste:

```javascript
const modifier = (text) => {
    text = LivingCharacters("output", text);
    return { text };
};

modifier(text);
```

---

## Step 7: Optional Input Modifier

The Input modifier is optional.

Open the **Input** tab and paste:

```javascript
const modifier = (text) => {
    text = LivingCharacters("input", text);
    return { text };
};

modifier(text);
```

---

## Step 8: Create a Configuration Story Card

Create a Story Card named:

```text
LIVING CHARACTERS CONFIG
```

This card controls:

* Character roster
* Pressures
* Life Card interval
* Scene relevance settings
* Maximum active Life Cards
* Other Living Characters options

---

## Step 9: Configure Living Characters

Add your character roster and settings to the configuration card.

Example:

```text
PROTAGONIST_NAME: Jessica

CHARACTERS:
Griff
Dominic
Winter
Charlotte
Ariel
Zephyr

LIFE_CARD_INTERVAL: 15
MAX_ACTIVE_CARDS: 2

SCENE_RELEVANCE: off

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

---

## Step 10: Start Playing

Start your scenario normally.

Living Characters will automatically create Life Cards that generate:

* Friendships
* Rivalries
* Attraction
* Jealousy
* Arguments
* Trust
* Social drama
* Long-term relationship arcs
* Emergent character stories

No additional player input is required.

Characters will gradually develop their own relationships and storylines as the adventure progresses.
