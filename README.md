# Living Characters

> Living Characters doesn't write stories. It gives characters reasons to create stories themselves.

Living Characters is an autonomous social simulation engine for AI Dungeon that creates evolving relationships, rivalries, drama, and long-term story threads between NPCs.

Instead of every character waiting for the protagonist to act, Living Characters allows NPCs to develop friendships, grudges, attraction, jealousy, trust, conflict, gossip, and ongoing social dynamics on their own.

The result is a world that feels alive even when the player is not directly involved.

---

## Why Living Characters Exists

Many AI Dungeon stories eventually suffer from the same problem:

The protagonist becomes the center of everything.

Characters react to the player.

Characters talk to the player.

Characters wait for the player.

But very little happens between the NPCs themselves.

This often creates worlds that feel static and artificial.

Living Characters was created to solve that problem.

The goal is not to replace the story.

The goal is to create a living social world where characters develop their own relationships, tensions, and storylines that continue evolving over time.

---

## What Living Characters Creates

Living Characters can generate:

* Friendships
* Rivalries
* Attraction
* Jealousy
* Trust
* Betrayal
* Social conflict
* Gossip
* Grudges
* Long-term relationship arcs
* Emergent character drama

Life Cards allow relationships to persist across scenes, creating consequences that can continue influencing the story long after the original event occurred.

---

## Example

Without Living Characters:
Jessica enters the room.

Everyone looks at Jessica.

Everyone waits for Jessica to do something.


With Living Characters:
Greg enters the room.

Heidi and Jack are arguing.

Elizabeth keeps getting distracted whenever Tristan speaks.

Jax quietly judges everyone from across the room.

Sydney is still angry about something that happened several scenes ago.


The player enters an existing story instead of creating every story themselves.

---

## Features
* Autonomous NPC relationship development
* Persistent Life Cards
* Long-term social memory
* Relationship-driven story generation
* Configurable pressure systems
* Multiple pacing options
* Model-specific recommendations
* Supports small casts and large casts
* Works across a wide variety of genres

---

## Tested Models

### Dynamic Large

Recommended

* Best overall results during testing
* Handles multiple active Life Cards well
* Strong relationship consistency
* Excellent emergent storytelling
* Does not require strict scene relevance

Recommended configuration:
SCENE_RELEVANCE: off
MAX_ACTIVE_CARDS: 2
LIFE_CARD_INTERVAL: 10-15


### Hearthfire

Recommended

* Strong scene awareness
* Focused storylines
* Best with a single active Life Card

Recommended configuration:
SCENE_RELEVANCE: strict
MAX_ACTIVE_CARDS: 1
LIFE_CARD_INTERVAL: 15-20


### Gemma 4 31B

Supported

* Follows pressures reliably
* Less reliable with specific owner-target relationships
* Benefits from stronger author guidance

Recommended configuration:
SCENE_RELEVANCE: strict
LIFE_CARD_INTERVAL: 15

### Deepseek V4 Flash

Supported

* Strong scene awareness
* Focused storylines
* Best with a single active Life Card

Recommended configuration:
SCENE_RELEVANCE: strict
MAX_ACTIVE_CARDS: 1
LIFE_CARD_INTERVAL: 15-20

### Nova

Currently not recommended.

Testing produced:

* Empty responses
* Inconsistent participation
* Lower reliability compared to other models

---

## Documentation

Detailed documentation is available in the repository:
* Installation
* Configuration Card Setup
* Pressure Set Ups
* Model Recommendations
* Release Notes

---

## Project Status
Living Characters is currently in release-candidate status.

Current development focus:
* Documentation
* Optimization
* Community testing
* Additional pressure packs
* Quality-of-life improvements

No major engine rewrites are currently planned.

---

## License

MIT License

Free to use, modify, and distribute.

---

🌱 Give your characters lives of their own.
