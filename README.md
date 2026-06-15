# LivingCharacters

Living Characters

AI Dungeon NPCs often become fixated on the player, causing the world to feel static and reactive.

Living Characters creates autonomous social threads between NPCs, allowing friendships, rivalries, attraction, jealousy, gossip, grudges, and drama to develop without direct player involvement.

The result is a world where characters continue living their own lives instead of waiting for the protagonist to act.

Autonomous social simulation system that creates evolving relationships, rivalries, drama, and emergent story threads for AI Dungeon.

## Known Model Behaviors

### Dynamic Large

Recommended

- Best overall results during testing
- Handles off-screen social threads well
- Does not require strict scene relevance
- Consistently follows Life Card relationships and pressures

### Hearthfire

Recommended

SCENE_RELEVANCE: strict
MAX_ACTIVE_CARDS: 1

- Produces focused storylines
- Performs best with a single active Life Card
- Strong scene awareness
- Benefits from slower pacing and longer thread lifespans

### Gemma

Recommended

SCENE_RELEVANCE: strict

- Recognizes Life Card pressures reliably
- May not consistently follow the intended target relationship
- Benefits from additional Author Note guidance

### Nova

Not currently recommended

Testing produced:
- Frequent empty responses
- Inconsistent Life Card participation
- Reduced reliability compared to other models

Support may improve with future model updates.
