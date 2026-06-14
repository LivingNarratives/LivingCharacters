# LivingCharacters
Autonomous social simulation system that creates evolving relationships, rivalries, drama, and emergent story threads for AI Dungeon.

Living Characters creates evolving relationships, rivalries, drama, friendships, attraction, conflict, and long-term social storylines between NPCs.

Unlike traditional story cards, characters develop their own ongoing narratives that continue influencing the world around them.

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
