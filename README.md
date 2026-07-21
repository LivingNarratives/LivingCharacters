![Living Characters World Events Update](./WorldEventsUpdate.png)

<div align="center">

# 🌱 Living Characters

### Autonomous NPC relationship simulation for AI Dungeon

**Living Characters doesn't write stories.**  
**It gives characters reasons to create stories themselves.**

[Installation](./installation.md) • [Configuration](./configuration.md) • [Pressure Presets Website](https://LivingNarratives.github.io/LivingCharacters) • [License](./LICENSE)

</div>

---

## 🎮 Try the Demo

Want to see it in action right away?

**[▶ Play the Living Characters Demo Scenario](https://play.aidungeon.com/scenario/BgA79ymBMXCC/living-characters?share=true&published=true)**

---

## ✨ What It Does

Living Characters adds two lightweight systems to AI Dungeon:

### 🌍 World Events

World Events are optional, autonomous developments that affect the wider story world rather than beginning with a specific character. Add them under the `WORLD_EVENTS:` heading in the **Events Configuration** section of the **LIVING CHARACTERS CONFIG** card. The narrator decides which characters are pulled into an event, allowing unexpected developments to emerge without player prompting.

World Events use the same active-card capacity as Life Cards and can influence the characters and social threads already in play. See [Configuration](./configuration.md#world-events) for setup options and examples.

### 🌱 Life Cards

Life Cards create autonomous social threads between characters so your story world stops revolving only around the protagonist.

Life Cards can run from the general cast or from optional relationship targeting in the **LIVING CHARACTERS RELATIONSHIPS** card. Rules use simple syntax like `Luke>Larry=fight,yell,argue`, spaces around `>` and `=` are optional, and omitted or empty pressure lists use the global default pressure list. Living Characters uses a round-robin scheduler with graceful fallbacks to balance Relationship Life Cards, Random Life Cards, and World Events.

| Without Living Characters       | With Life Cards                             |
| ------------------------------- | ------------------------------------------- |
| Everyone waits for the player.  | NPCs develop their own drama.               |
| Relationships reset constantly. | Life Cards preserve ongoing social threads. |
| The world feels reactive.       | The world feels alive.                      |

### Round Robin Scheduler

Living Characters uses a fixed round-robin rotation to balance enabled Life Card types:

```text
Relationships
→ Event
→ Random
→ Relationships
→ Random
→ Relationships
→ Event
→ Repeat
```

Every step has graceful fallback behavior. If the scheduled type is disabled or cannot generate a card because of cooldowns, no eligible characters, active card limits, or another eligibility condition, the scheduler automatically continues to the next available type instead of stalling or waiting.

This preserves the intended cadence while keeping the simulation moving. It works with any combination of enabled systems, including Relationship-only, Random-only, Event-only, or any mix of the three.

### 💭 Thought Cards

Thought Cards are optional character thought journals.

They let selected characters privately form short thoughts that are saved to separate player-readable cards. These thoughts are for you to look back on later. They do not enter story context, do not affect Life Cards, and do not control character behavior.

| Without Thought Cards                         | With Thought Cards                      |
| --------------------------------------------- | --------------------------------------- |
| Character thoughts disappear after the scene. | Thoughts are saved for later reading.   |
| You only see what reaches the story.          | You can peek at private reactions.      |
| Inner lives are implied.                      | Characters leave little thought trails. |

---

## Setup Note

If you use Thought Cards, turn **Optimized Context** off in AI Dungeon.

Thought Cards are not compatible with AI Dungeon's Optimized Context feature.
Disable Optimized Context when using Thought Cards.

Thought Card numbers are permanent. Thoughts no longer renumber after rollover, and Thought Cards have no fixed 10-thought cap anymore.

New thoughts stay in Entry. Older thoughts roll into Notes, and Notes trims the oldest archived thoughts only when full. Thought Card contents are still not injected into story context.

Thought Cards use an internal storage safety buffer during Entry -> Notes rollover. This helps prevent rare long-thought bleed-over when storage is nearly full, without shortening or limiting individual thoughts.

The 💭 marker shows the most recently updated Thought Card. Living Characters scans all Thought Cards and clears older 💭 markers before marking the newest updated card, so only one Thought Card should show 💭 at a time.

Updated Thought Story Cards are deleted and recreated when saved, which keeps the most recently updated Thought Card near the top of AI Dungeon's Story Card list. No user configuration is required.

Thought Cards now validate attribution against the intended character before saving, which prevents rare wrong-character assignments when a model returns an incorrect label.

Thoughts now introduce characters by first name and then move naturally into pronouns where appropriate, making internal monologue smoother without losing clarity.

The latest Thought Card update fixes cases where Thought Card content could bleed into the AI narrator's generated response, particularly on Hearthfire. It also improves repeated-thought handling and strongly favors explicit character names over pronouns when filing thoughts. The repetition fix is especially helpful on Gemma.

Living Characters also includes a `YOU` fallback trigger for Life Card injection. If neither participant on an active Life Card has been referenced yet, the script can use the protagonist's `YOU` reference so the relevant Life Card is still injected into model context instead of waiting for one participant to be mentioned.

For most adventures, use `SCENE_RELEVANCE_MODE: off`. This allows autonomous Life Cards to develop naturally even when characters are not currently in the scene.

---

## Troubleshooting

If AI Dungeon shows **"The AI service returned an empty response"**, update to the latest Living Characters library. The script now returns a zero-width fallback character when hidden/private output is stripped and nothing visible remains. This is meant to reduce empty-response errors, especially seen during Nova testing, without showing private Thought Card text to the player.

The latest release also adds another final-output safeguard to further reduce blank narrator responses after hidden/private output is removed.

It also fixes a narrator response formatting issue where returned story text could be missing a needed space.

---

## 🌿 Characters Can Develop

| Relationships | Drama | Social Texture |
|---|---|---|
| Friendships | Rivalries | Gossip |
| Attraction | Betrayal | Avoidance |
| Trust | Jealousy | Grudges |
| Protectiveness | Conflict | Long-term arcs |

---

## 🎭 Example

**Without Living Characters**

```text
Jessica enters the room.

Everyone looks at Jessica.

Everyone waits for Jessica to do something.
```
