/*
LIVING CHARACTERS - AUTONOMOUS SOCIAL ENGINE
A LivingNarratives project. Everything in this file is part of Living Characters.

Docs, install, configuration, model tips, pressure presets, and troubleshooting:
https://github.com/LivingNarratives/LivingCharacters
(GitHub is the single source of truth -- always use it for the current version.)

This file contains TWO independent systems that belong to Living Characters:
  1. Life Cards   - the autonomous NPC social-pressure engine (the bulk of this file).
  2. Thought Cards- optional, player-facing thought journals ("Name - Thoughts"; a
                    temporary 💭 marks the card that was just updated).
                    Thought Cards are NOT brain cards and NOT memory: they never enter
                    story context, are never read by the AI narrator, and never affect
                    behavior, Life Card creation, targeting, pressure, momentum, or any
                    story logic. The system only asks the model for a thought, captures
                    it, and stores it for the player to read later. See the "THOUGHT
                    CARD SYSTEM" module further down for full details.

Paste this whole block in: LIBRARY

CONTEXT TAB:
const modifier = (text) => {
  text = LivingCharacters("context", text);
  return { text };
};
modifier(text);

OUTPUT TAB:
const modifier = (text) => {
  text = LivingCharacters("output", text);
  return { text };
};
modifier(text);

INPUT TAB (optional):
const modifier = (text) => {
  text = LivingCharacters("input", text);
  return { text };
};
modifier(text);

(Existing adventures whose tabs still call ChaosGoblinV2(...) keep working via a
 compatibility alias at the bottom of this file.)
*/

function LivingCharacters(hook, hookText) {
  "use strict";

  const CFG = {
    VERSION: "2.53-living-characters-2026-06-19",

    // All cast / protagonist / pressures / pacing come from the editable config
    // Story Card below. No scenario-specific names live in engine logic.
    CONFIG_CARD_TITLE: "LIVING CHARACTERS CONFIG",
    CONFIG_CARD_KEY: "living-characters-config",
    CONFIG_CARD_TYPE: "Config",
    // Old config cards used this exact NOTES text (not a roster). Recognized so it
    // is not mistaken for character names during the NOTES-roster migration.
    LEGACY_CONFIG_NOTES: "Living Characters setup. Edit cast, protagonist, pressures, and pacing here.",

    // User-facing card naming is "Life". The key prefix VALUE ("chaos-v2:") is kept
    // unchanged for save/card compatibility so existing Life cards (and legacy
    // "Chaos - " cards) are still found by key and auto-migrated to Life titles.
    LIFE_CARD_TYPE: "Life",
    LIFE_CARD_TITLE_PREFIX: "Life - ",
    LIFE_CARD_KEY_PREFIX: "chaos-v2:",

    // Seedling indicator shown while a Life card is unresolved; dropped on resolve.
    SEEDLING: "🌱",
    SEEDLING_IN_TITLE: true,

    DEBUG: false,
    DEBUG_CARD_TITLE: "Living Characters Debug",
    DEBUG_CARD_KEY: "lc-debug",
    DEBUG_CARD_TYPE: "Debug",

    AUTONOMY_ENABLED: true,
    AUTONOMY_MAX_PENDING_AGE: 1,

    // Internal timing constants (NOT exposed on the public config card -- adjust here if
    // needed). Dormancy cadence: threads age toward dormant on this turn interval.
    THREAD_REMINDER_EVERY: 7,   // slower aging so cards do not burn out too quickly
    THREAD_REMINDER_MAX: 3,
    // Write-back checkpoint cadence: how often the LC_MEMORY write-back is offered.
    // INDEPENDENT of dormancy -- it never ages cards or affects lifespan.
    CHECKPOINT_EVERY: 3,        // more frequent chances for Life Cards to develop

    // Which active Life Cards are injected into context:
    //   "strict" - only scene-relevant cards (an involved NPC is present)
    //   "off"    - any active card (off-screen threads usable as world-state)
    //   "hybrid" - scene-relevant first, then fill remaining slots off-screen
    SCENE_RELEVANCE_MODE: "strict",

    // HARD cap on simultaneously-open Life threads.
    // Config can choose 1 or 2 active cards.
    // When active slots are full, no new Life Card is rolled, seeded, replaced, or deleted.
    // The system waits until an active card archives naturally.
    MAX_ACTIVE_LIFE_CARDS: 2,
    ACTIVE_LIFE_STATUSES: ["active", "simmering", "surfaced"],
    // After this many dormancy-cadence appearances, an unresolved card goes dormant.
    THREAD_REMINDERS_BEFORE_DORMANT: 3,
    // No Life Card may be created before this turn (1 = allow from the first turn).
    MIN_TURN_BEFORE_FIRST_SEED: 1,
    // A card is flagged FRESH PRESSURE (urgent "reflect this now") for this many turns
    // after it fires. 0 = only the turn it fires.
    FRESH_THREAD_WINDOW: 1,

    // If the narrator shows a Life Card's actor but returns no <LC_MEMORY>, complete
    // the card from the seed instead of leaving the placeholder forever.
    AUTO_COMPLETE_ONSCREEN_SEEDS: true,

    // Whether a Life Card also triggers on its NPC target (not just its owner).
    // The protagonist is never added as a trigger. Override in the config card.
    TRIGGER_ON_TARGET: true,

    // Legacy/optional. Adds a shared trigger token to active cards + injects it into
    // the block. Only helps systems that RE-SCAN the modified context for triggers;
    // Hearthfire does not, so this is off by default now that the block carries the
    // full card details directly. Leave false unless you know your front-end re-scans.
    FORCE_ACTIVE_CARD_TRIGGER: false,
    ACTIVE_SHARED_TRIGGER: "life-thread",

    MAX_CONTEXT_CARDS: 4,
    MAX_EVENT_LOG: 12,
    // How many trailing context characters the scene detector scans (current scene).
    SCENE_SCAN_CHARS: 2000,
    // In second-person stories the protagonist is "you" and the name rarely appears,
    // but the protagonist is always present. When true (and a PROTAGONIST_NAME is set),
    // the protagonist always counts as in-scene so protagonist-targeted threads are
    // not disadvantaged. Set false for third-person stories that name the protagonist.
    PROTAGONIST_ALWAYS_PRESENT: true,

    // How often NPC Life Cards TARGET the protagonist. This is a TARGET-side
    // selection bias ONLY -- it does NOT let the protagonist OWN a Life Card and
    // never has the narrator author the player's private thoughts/interiority.
    //   "off"    - protagonist is excluded from target selection (pure NPC-to-NPC)
    //   "normal" - default; protagonist can be targeted with no special weighting
    //   "high"   - protagonist gets extra target weight (~3x an NPC); NPC-to-NPC still happens
    //   "always" - new cards target the protagonist when legal; safe fallback otherwise
    // If no PROTAGONIST_NAME is configured, every mode degrades safely to "normal".
    PROTAGONIST_INVOLVEMENT: "normal",

    // ---- Thought Card system (SEPARATE from Life Cards) --------------------
    // Player-facing thought journals. Thought Cards never enter context, are never
    // read by the AI, and never affect Life Card logic. Own config card, own state.
    THOUGHT_CONFIG_CARD_TITLE: "THOUGHT CARDS CONFIG",
    THOUGHT_CONFIG_CARD_KEY: "living-thoughts-config",
    THOUGHT_CONFIG_CARD_TYPE: "Config",
    // Title format is character-first for easy scanning. Base title: "Name - Thoughts".
    // The 💭 is a TEMPORARY "recently updated" marker prepended to the title (see below),
    // NOT a permanent part of it -- so the player can see which card just changed.
    THOUGHT_CARD_TITLE_SUFFIX: " - Thoughts",
    THOUGHT_MARKER: "💭",            // temporary "new thought / recently updated" title marker
    THOUGHT_MARKER_TURNS: 3,         // turns the 💭 marker stays before it clears
    THOUGHT_CARD_KEY_PREFIX: "lc-thoughts:",                // non-matching key -> never injected (UNCHANGED)
    THOUGHT_CARD_TYPE: "Custom",
    THOUGHTS_ENABLED_DEFAULT: false,    // opt-in; off by default
    THOUGHT_INTERVAL_DEFAULT: 5,        // turns between thought attempts
    THOUGHT_CHANCE_DEFAULT: 50,         // % chance per eligible turn
    MAX_THOUGHTS_DEFAULT: 10,           // HARDCODED per-character cap (not a user config option)
    // Default is "scene": a character only gets a thought when they are actually in the
    // current scene. No silent fallback to the roster (that is the opt-in "roster" mode).
    THOUGHT_SCENE_MODE_DEFAULT: "scene", // scene | recent | roster
    THOUGHT_SCENE_TIGHT_CHARS: 700,     // "scene" mode: how many trailing chars count as the CURRENT scene

    // Fallback pressures, used ONLY if the config card lists none. Generic and
    // scenario-agnostic; users override these in the config card's PRESSURES.
    DEFAULT_PRESSURES: [
      "attraction", "fondness", "friendship", "protectiveness",
      "curiosity", "envy", "jealousy", "rivalry",
      "betrayal", "resentment", "trust", "suspicion"
    ],

    // LIFE_CARD_INTERVAL default: turns between Life Card generation ATTEMPTS.
    // 0 = Off. Lower = more social activity, higher = less.
    DEFAULT_ACTIVITY_TURNS: 15,
    // Legacy SOCIAL_ACTIVITY (deprecated) -> LIFE_CARD_INTERVAL. Auto-converted
    // when an old config card has no LIFE_CARD_INTERVAL line.
    LEGACY_ACTIVITY_MAP: { off: 0, chaos: 5, busy: 10, balanced: 15, quiet: 20 },
    // TARGET_COOLDOWN is counted in Life Cards (how many must occur before the same
    // character can be selected again), not in turns.
    DEFAULT_TARGET_COOLDOWN: 3,

    STATUS_VALUES: ["active", "simmering", "surfaced", "dormant", "resolved"]
  };

  function getGlobalText(fallback) {
    if (typeof hookText === "string") return hookText;
    if (typeof globalThis.text === "string") return globalThis.text;
    return fallback || "";
  }

  function setGlobalText(value) {
    if (typeof globalThis.text === "string") globalThis.text = String(value || "");
  }

  // ---- Generic configuration card -----------------------------------------
  // All cast / protagonist / pressures / pacing are read from an editable Story
  // Card. The engine holds no scenario-specific names.
  function defaultConfigEntry() {
    return [
      "LIVING CHARACTERS",
      "",
      "For installation, configuration options, model recommendations, pressure",
      "presets, updates, and troubleshooting, visit:",
      "https://github.com/LivingNarratives/LivingCharacters",
      "Always refer to the GitHub documentation for the most current version.",
      "",
      "( Characters go in this card's NOTES, one name per line. )",
      "",
      "PROTAGONIST_NAME:",
      "None",
      "",
      "SCENE_RELEVANCE_MODE:",
      "strict",
      "",
      "PRESSURES:",
      "friendship",
      "trust",
      "curiosity",
      "protectiveness",
      "jealousy",
      "rivalry",
      "attraction",
      "teasing",
      "gossip",
      "misunderstanding",
      "",
      "LIFE_CARD_INTERVAL:",
      "15",
      "",
      "TARGET_COOLDOWN:",
      "3",
      "",
      "MAX_ACTIVE_CARDS:",
      "2",
      "",
      "PROTAGONIST_INVOLVEMENT:",
      "normal",
      "Options: off | normal | high | always"
    ].join("\n");
  }

  // The character roster lives in the config card's NOTES (description).
  function defaultConfigNotes() {
    return [
      "( Add one character name per line below. See GitHub for help. )",
      "Characters:"
    ].join("\n");
  }

  // Parse a roster from NOTES text: one name per line, trimmed, blanks and
  // ( comments ) ignored, multi-word names preserved.
  function isConfigSectionLabel(value) {
    const line = String(value || "").trim();
    const colon = line.indexOf(":");
    if (colon === -1 || line.slice(colon + 1).trim()) return false;
    const head = line.slice(0, colon).trim().toLowerCase().replace(/\s+/g, "_");
    const labels = [
      "protagonist_name", "protagonist_involvement", "characters", "pressures",
      "life_card_interval", "social_activity", "target_cooldown", "max_active_cards",
      "scene_relevance_mode", "scene_relevance", "trigger_on_target",
      "force_active_card_trigger", "protagonist_always_present"
    ];
    return labels.indexOf(head) !== -1;
  }

  function parseRoster(notes) {
    const lines = String(notes || "").replace(/\r/g, "").split("\n");
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw || raw.charAt(0) === "(" || isConfigSectionLabel(raw)) continue;
      const v = cleanName(raw);
      if (v && out.indexOf(v) === -1) out.push(v);
    }
    return out;
  }

  function ensureConfigCard() {
    const existing = findStoryCardByKeys(CFG.CONFIG_CARD_KEY) || findStoryCardByTitle(CFG.CONFIG_CARD_TITLE);
    if (existing) return existing;
    return createOrPatchStoryCard(
      CFG.CONFIG_CARD_TITLE,
      CFG.CONFIG_CARD_TYPE,
      CFG.CONFIG_CARD_KEY,
      defaultConfigEntry(),
      defaultConfigNotes()
    );
  }

  function parseConfigText(text, keysOverride) {
    const KEYS = keysOverride || ["protagonist_name", "characters", "pressures", "life_card_interval", "social_activity", "target_cooldown", "max_active_cards", "scene_relevance_mode", "scene_relevance", "trigger_on_target", "force_active_card_trigger", "protagonist_always_present", "protagonist_involvement"];
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const sections = {};
    let current = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const colon = line.indexOf(":");
      const head = (colon !== -1 ? line.slice(0, colon) : line).trim().toLowerCase().replace(/\s+/g, "_");
      if (KEYS.indexOf(head) !== -1) {
        current = head;
        if (!sections[current]) sections[current] = [];
        const after = colon !== -1 ? line.slice(colon + 1).trim() : "";
        if (after) sections[current].push(after);
        continue;
      }
      if (current) sections[current].push(line);
    }
    return sections;
  }

  function configFirst(sections, key, dflt) {
    const arr = sections[key];
    if (arr) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].charAt(0) !== "(") return arr[i].trim();
      }
    }
    return dflt;
  }

  function configList(sections, key) {
    const arr = sections[key] || [];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i] || arr[i].charAt(0) === "(" || (key === "characters" && isConfigSectionLabel(arr[i]))) continue;
      const v = cleanName(arr[i]);
      if (v && out.indexOf(v) === -1) out.push(v);
    }
    return out;
  }

  function toIntOr(value, dflt) {
    const n = parseInt(String(value).replace(/[^0-9-]/g, ""), 10);
    return isNaN(n) ? dflt : n;
  }

  function toBoolOr(value, dflt) {
    if (value == null) return dflt;
    const s = String(value).trim().toLowerCase();
    if (s === "true" || s === "yes" || s === "on" || s === "1") return true;
    if (s === "false" || s === "no" || s === "off" || s === "0") return false;
    return dflt;
  }

  function buildRuntimeConfig() {
    ensureConfigCard();
    const card = findStoryCardByKeys(CFG.CONFIG_CARD_KEY) || findStoryCardByTitle(CFG.CONFIG_CARD_TITLE);
    const sections = parseConfigText(card && card.entry);

    let protagonist = cleanName(configFirst(sections, "protagonist_name", ""));
    if (/^none$/i.test(protagonist) || /^n\/?a$/i.test(protagonist)) protagonist = "";

    // Roster: prefer the card NOTES (description). The old default NOTES string is
    // not a roster, so ignore it. Fall back to the legacy ENTRY CHARACTERS section
    // for older cards so they do not break.
    const notes = (card && card.description) || "";
    let rosterSource = "NOTES";
    let characters = (String(notes).trim() === CFG.LEGACY_CONFIG_NOTES) ? [] : parseRoster(notes);
    if (!characters.length) {
      characters = configList(sections, "characters");
      rosterSource = characters.length ? "ENTRY (legacy)" : "none";
    }
    characters = characters.filter(function(n) { return n && n !== protagonist; });

    let pressures = configList(sections, "pressures").map(function(p) { return p.toLowerCase(); });
    if (!pressures.length) pressures = CFG.DEFAULT_PRESSURES.slice();

    // LIFE_CARD_INTERVAL -> turns between Life Card attempts. 0 disables generation.
    // SOCIAL_ACTIVITY is deprecated; if an old card has it but no LIFE_CARD_INTERVAL,
    // auto-convert the keyword to the matching interval (no silent Balanced fallback).
    const intervalRaw = configFirst(sections, "life_card_interval", null);
    const legacyRaw = configFirst(sections, "social_activity", null);
    let legacyActivityUsed = false;
    let interval;
    if (intervalRaw != null) {
      interval = toIntOr(intervalRaw, CFG.DEFAULT_ACTIVITY_TURNS);
    } else if (legacyRaw != null) {
      legacyActivityUsed = true;
      const key = String(legacyRaw).toLowerCase().replace(/\s+/g, "");
      interval = CFG.LEGACY_ACTIVITY_MAP[key] != null
        ? CFG.LEGACY_ACTIVITY_MAP[key]
        : toIntOr(legacyRaw, CFG.DEFAULT_ACTIVITY_TURNS);
    } else {
      interval = CFG.DEFAULT_ACTIVITY_TURNS;
    }
    const activityOff = (interval <= 0);
    const activityTurns = activityOff ? 0 : Math.max(1, interval);

    const targetCooldown = Math.max(0, toIntOr(configFirst(sections, "target_cooldown", CFG.DEFAULT_TARGET_COOLDOWN), CFG.DEFAULT_TARGET_COOLDOWN));
    // Configurable, clamped to 1-2 (3+ not allowed for now).
    //   1 = focused mode (one storyline at a time)
    //   2 = layered mode (two interwoven threads)
    const maxActive = Math.max(1, Math.min(2, toIntOr(configFirst(sections, "max_active_cards", CFG.MAX_ACTIVE_LIFE_CARDS), CFG.MAX_ACTIVE_LIFE_CARDS)));
    const triggerOnTarget = toBoolOr(configFirst(sections, "trigger_on_target", null), CFG.TRIGGER_ON_TARGET);
    const forceActiveCardTrigger = toBoolOr(configFirst(sections, "force_active_card_trigger", null), CFG.FORCE_ACTIVE_CARD_TRIGGER);
    const protagonistAlwaysPresent = toBoolOr(configFirst(sections, "protagonist_always_present", null), CFG.PROTAGONIST_ALWAYS_PRESENT);

    // Scene relevance mode: strict | off | hybrid (validated; default strict).
    // Accept both SCENE_RELEVANCE_MODE and the SCENE_RELEVANCE alias. Prefer
    // SCENE_RELEVANCE_MODE if present, else SCENE_RELEVANCE, else the default.
    let sceneMode = String(
      configFirst(
        sections,
        "scene_relevance_mode",
        configFirst(sections, "scene_relevance", CFG.SCENE_RELEVANCE_MODE)
      )
    ).toLowerCase().replace(/\s+/g, "");
    if (sceneMode !== "strict" && sceneMode !== "off" && sceneMode !== "hybrid") sceneMode = CFG.SCENE_RELEVANCE_MODE;

    // Two INDEPENDENT cadences (decoupled), hardwired internally and NOT exposed on the
    // public config card. Adjust the CFG constants if needed.
    //   CHECKPOINT_EVERY      -> write-back (LC_MEMORY) opportunity only. No lifespan effect.
    //   THREAD_REMINDER_EVERY -> dormancy/reminder aging only (card lifespan).
    const checkpointEvery = CFG.CHECKPOINT_EVERY;
    const threadReminderEvery = CFG.THREAD_REMINDER_EVERY;

    // Protagonist involvement: off | normal | high | always (validated; default normal).
    // TARGET-side bias only -- never makes the protagonist an owner. With no protagonist
    // configured the bias is meaningless, so it degrades safely to "normal".
    let involvement = String(configFirst(sections, "protagonist_involvement", CFG.PROTAGONIST_INVOLVEMENT)).toLowerCase().replace(/\s+/g, "");
    if (involvement !== "off" && involvement !== "normal" && involvement !== "high" && involvement !== "always") involvement = CFG.PROTAGONIST_INVOLVEMENT;
    if (!protagonist) involvement = "normal";

    return {
      protagonist: protagonist,
      characters: characters,
      rosterSource: rosterSource,
      pressures: pressures,
      activityOff: activityOff,
      activityTurns: activityTurns,
      legacyActivityUsed: legacyActivityUsed,
      targetCooldown: targetCooldown,
      maxActive: maxActive,
      sceneRelevanceMode: sceneMode,
      triggerOnTarget: triggerOnTarget,
      forceActiveCardTrigger: forceActiveCardTrigger,
      protagonistAlwaysPresent: protagonistAlwaysPresent,
      protagonistInvolvement: involvement,
      checkpointEvery: checkpointEvery,
      threadReminderEvery: threadReminderEvery
    };
  }

  function ensureState() {
    if (!globalThis.state || typeof state !== "object") globalThis.state = {};
    // NOTE: the persistent save key is intentionally kept as `chaosGoblinV2` for
    // backward compatibility — existing adventures store their Life Threads here.
    // Renaming it would orphan every saved thread, so the key stays; only the
    // surrounding code/naming is modernized. `lc` below is the live engine state.
    if (!state.chaosGoblinV2) {
      state.chaosGoblinV2 = {
        version: CFG.VERSION,
        turn: 0,
        pendingSeed: null,
        cards: {},
        actorSeedIndex: {},
        seedCount: 0,
        lastSeedAttemptTurn: 0,
        recentSeeds: [],
        recentMemory: []
      };
    }
    const cg = state.chaosGoblinV2;
    cg.version = CFG.VERSION;
    if (!cg.cards || typeof cg.cards !== "object") cg.cards = {};
    if (!cg.actorSeedIndex || typeof cg.actorSeedIndex !== "object") cg.actorSeedIndex = {};
    if (typeof cg.seedCount !== "number") cg.seedCount = 0;
    if (!Array.isArray(cg.recentSeeds)) cg.recentSeeds = [];
    if (!Array.isArray(cg.recentMemory)) cg.recentMemory = [];
    return cg;
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function cleanName(value) {
    let s = String(value || "").replace(/[^A-Za-z0-9 _'-]/g, " ").trim();
    s = s.replace(/\s+/g, " ");
    return s.slice(0, 50);
  }

  function keyName(name) {
    return cleanName(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function containsWholeWord(text, word) {
    text = String(text || "").toLowerCase();
    word = String(word || "").toLowerCase();
    if (!word) return false;
    let pos = text.indexOf(word);
    while (pos !== -1) {
      const before = pos === 0 ? " " : text.charAt(pos - 1);
      const after = pos + word.length >= text.length ? " " : text.charAt(pos + word.length);
      const bWord = /[a-z0-9_]/.test(before);
      const aWord = /[a-z0-9_]/.test(after);
      if (!bWord && !aWord) return true;
      pos = text.indexOf(word, pos + 1);
    }
    return false;
  }

  function unique(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const item = cleanName(list[i]);
      if (item && out.indexOf(item) === -1) out.push(item);
    }
    return out;
  }

  function playerName() {
    return LC.protagonist || "";
  }

  function npcRoster() {
    const p = playerName();
    return unique(LC.characters || []).filter(function(name) {
      return name !== p;
    });
  }

  // Scene detector: which configured characters (protagonist + roster) appear in
  // the recent context. Scans the TAIL of the context (the current scene), matches
  // whole words/phrases so multi-word names work, and includes the protagonist so
  // the engine knows when the player is present.
  // Text for the CURRENT scene. Prefer recent story actions (history), which EXCLUDE
  // story-card entries, memory, author's note, and injected notes — so strict scene
  // relevance means "in the visible scene", not "named somewhere in context".
  function recentSceneText(contextFallback) {
    const cg = ensureState();
    if (Array.isArray(globalThis.history) && history.length) {
      let s = "";
      for (let i = history.length - 1; i >= 0 && s.length < CFG.SCENE_SCAN_CHARS; i--) {
        const h = history[i];
        const t = (h && typeof h.text === "string") ? h.text : (typeof h === "string" ? h : "");
        if (t) s = t + "\n" + s;
      }
      if (s.replace(/\s/g, "")) { cg.sceneSource = "history"; return s; }
    }
    cg.sceneSource = "context-tail";
    const text = String(contextFallback || "");
    return text.length > CFG.SCENE_SCAN_CHARS ? text.slice(-CFG.SCENE_SCAN_CHARS) : text;
  }

  function sceneActors(text) {
    const recent = recentSceneText(text);
    const p = playerName();
    const found = [];
    // Protagonist is present by default (second-person "you" rarely names them).
    if (p && LC.protagonistAlwaysPresent) found.push(p);
    // NPCs are detected by name in the recent scene text.
    const names = npcRoster();
    for (let i = 0; i < names.length; i++) {
      if (names[i] && containsWholeWord(recent, names[i])) found.push(names[i]);
    }
    // Also detect the protagonist by name (third-person stories that name them).
    if (p && found.indexOf(p) === -1 && containsWholeWord(recent, p)) found.push(p);
    return unique(found);
  }

  function randomInt(max) {
    return Math.floor(Math.random() * Math.max(1, max));
  }

  function choose(list) {
    if (!list || !list.length) return "";
    return list[randomInt(list.length)];
  }

  function weightedChoice(pairs) {
    let total = 0;
    for (let i = 0; i < pairs.length; i++) total += Math.max(0, Number(pairs[i][1]) || 0);
    if (total <= 0) return pairs.length ? pairs[0][0] : "";
    let roll = Math.random() * total;
    for (let j = 0; j < pairs.length; j++) {
      roll -= Math.max(0, Number(pairs[j][1]) || 0);
      if (roll <= 0) return pairs[j][0];
    }
    return pairs[pairs.length - 1][0];
  }

  function ensureCardBucket(owner) {
    owner = cleanName(owner);
    if (!owner) return null;
    const cg = ensureState();
    if (!cg.cards[owner]) {
      cg.cards[owner] = {
        owner: owner,
        target: "",
        pressure: "",
        momentum: "",
        event: "",
        status: "simmering",
        reminderCount: 0,
        eventLog: []
      };
    }
    const b = cg.cards[owner];
    if (!Array.isArray(b.eventLog)) b.eventLog = [];
    if (typeof b.reminderCount !== "number") b.reminderCount = 0;
    return b;
  }

  function eventFingerprint(line) {
    return cleanText(line).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 120);
  }

  function appendEventLog(bucket, line) {
    line = cleanText(line);
    if (!bucket || !line) return;
    const fp = eventFingerprint(line);
    for (let i = 0; i < bucket.eventLog.length; i++) {
      if (eventFingerprint(bucket.eventLog[i]) === fp) return;
    }
    bucket.eventLog.push(line);
    while (bucket.eventLog.length > CFG.MAX_EVENT_LOG) bucket.eventLog.shift();
  }

  function applyMemory(memory) {
    const owner = cleanName(memory.owner);
    if (!owner) return false;
    const bucket = ensureCardBucket(owner);
    if (!bucket) return false;

    // Narrator authors the specific EVENT. System keeps PRESSURE/TARGET/MOMENTUM,
    // but fill them from memory if the card has none yet.
    if (memory.event) bucket.event = cleanText(memory.event);
    if (memory.target && !cleanText(bucket.target)) bucket.target = cleanName(memory.target);
    if (memory.pressure && !cleanText(bucket.pressure)) bucket.pressure = cleanText(memory.pressure);
    if (memory.momentum && !cleanText(bucket.momentum)) bucket.momentum = cleanText(memory.momentum);
    // Optional first-person thought: update only when the narrator supplies a non-empty
    // value; never blank an existing thought. Display-only, never used in engine logic.
    // NOTE: this legacy OWNER_THOUGHT lives on the Life Card and is fed by the LC_MEMORY
    // write-back (XML-style block authored by the narrator). It is SEPARATE from the
    // Thought Card system: Thought Cards do NOT use LC_MEMORY, XML, or narrator write-back
    // -- they use the leading-parenthetical capture and store to their own "💭 Thoughts"
    // cards. The two are independent; see the THOUGHT CARD SYSTEM module below.
    if (cleanText(memory.owner_thought)) bucket.ownerThought = cleanText(memory.owner_thought);

    const status = cleanText(memory.status).toLowerCase();
    bucket.status = CFG.STATUS_VALUES.indexOf(status) !== -1 ? status : (bucket.status || "active");
    bucket.reminderCount = 0; // narrator touched it; restart the dormancy clock

    appendEventLog(bucket, memory.log || memory.event);

    // Resolved threads archive permanently: drop the Story Card. HISTORY stays in
    // state so the character keeps a long-term social record.
    if (bucket.status === "resolved") {
      removeStoryCardByKeys(storyCardIdToken(owner));
    }

    const cg = ensureState();
    cg.recentMemory.push(owner + ": " + (memory.event || memory.log || ""));
    while (cg.recentMemory.length > 12) cg.recentMemory.shift();

    if (cg.pendingSeed && (owner === cg.pendingSeed.actor || owner === cg.pendingSeed.target)) {
      cg.pendingSeed = null;
    }
    return true;
  }

  function renderCardEntry(bucket) {
    const status = cleanText(bucket.status) || "active";
    // Dormant = archived record: STATUS only. HISTORY is in the card description.
    if (status.toLowerCase() === "dormant") return "STATUS: dormant";
    if (!cardHasContent(bucket)) return "";
    const target = cleanText(bucket.target) || "someone";
    const pressure = cleanText(bucket.pressure) || "unspoken social pressure";
    const momentum = cleanText(bucket.momentum) || "low";
    const occurrence = cleanText(bucket.event);
    const ownerThought = cleanText(bucket.ownerThought);
    // Seedling shows only while the thread is active; dropped when dormant/resolved.
    const statusLine = lifeStatusIsActive(status) ? (CFG.SEEDLING + " " + status) : status;
    // Compact one-line-per-field format (no blank lines) to keep Story Cards small.
    const out = ["TARGET: " + target, "PRESSURE: " + pressure];
    if (occurrence) out.push("OCCURRENCE: " + occurrence); // only if narrator authored it
    if (ownerThought) out.push("OWNER_THOUGHT: " + ownerThought); // LC_MEMORY-fed (legacy)
    out.push("MOMENTUM: " + momentum, "STATUS: " + statusLine);
    return out.join("\n");
  }

  function renderCardDescription(bucket) {
    const lines = bucket.eventLog || [];
    if (!lines.length) return "HISTORY:\n";
    const out = ["HISTORY:"];
    for (let i = 0; i < lines.length; i++) out.push("[" + (i + 1) + "] " + lines[i]);
    return out.join("\n");
  }

  // Stable per-character identity token. Never changes across a character's life
  // (even when the target changes). Used ONLY for lookup/removal.
  function storyCardIdToken(owner) {
    return CFG.LIFE_CARD_KEY_PREFIX + keyName(owner);
  }

  // Visible trigger list = identity token + owner name + (NPC target, if enabled).
  // Joined with "," and no trailing space. The protagonist, empty targets, and
  // "someone" placeholders are never added as triggers.
  function storyCardTriggers(bucket) {
    const owner = cleanName(bucket.owner);
    let triggers = storyCardIdToken(owner) + "," + owner;
    if (LC.triggerOnTarget) {
      const target = cleanName(bucket.target);
      const p = playerName();
      if (target && target !== owner && target !== p && target.toLowerCase() !== "someone") {
        triggers += "," + target;
      }
    }
    // Shared trigger token: only added here, and syncCards only runs for ACTIVE
    // cards, so dormant/resolved cards never carry it.
    if (LC.forceActiveCardTrigger && CFG.ACTIVE_SHARED_TRIGGER) {
      triggers += "," + CFG.ACTIVE_SHARED_TRIGGER;
    }
    return triggers;
  }

  // Identity = the FIRST trigger token only (normalized), never the full list.
  function keyIdToken(keys) {
    const s = String(keys || "");
    const comma = s.indexOf(",");
    return (comma === -1 ? s : s.slice(0, comma)).replace(/\s+/g, "").toLowerCase();
  }

  function cardTitle(owner, status) {
    const prefix = (CFG.SEEDLING_IN_TITLE && lifeStatusIsActive(status)) ? (CFG.SEEDLING + " ") : "";
    return prefix + CFG.LIFE_CARD_TITLE_PREFIX + owner;
  }

  function isUnnamedish(value) {
    const s = String(value || "").trim().toLowerCase();
    return !s || s === "unnamed" || s === "untyped" || s === "first name";
  }

  function findStoryCardByTitle(title) {
    if (!Array.isArray(globalThis.storyCards)) return null;
    for (let i = 0; i < storyCards.length; i++) {
      const card = storyCards[i];
      if (card && card.title === title) return card;
    }
    return null;
  }

  // Stable identity lookup by the FIRST trigger token (not the full trigger list),
  // so adding/removing a target trigger never changes a card's identity. Titles can
  // change (seedling on/off, Chaos->Life); the token stays constant.
  function findStoryCardByKeys(keys) {
    if (!Array.isArray(globalThis.storyCards)) return null;
    const token = keyIdToken(keys);
    for (let i = 0; i < storyCards.length; i++) {
      const card = storyCards[i];
      if (card && keyIdToken(card.keys) === token) return card;
    }
    return null;
  }

  // Remove a Story Card by its identity token so an archived thread leaves the card
  // list and stays gone (syncCards will not recreate a non-active bucket).
  function removeStoryCardByKeys(keys) {
    if (!keys || !Array.isArray(globalThis.storyCards)) return;
    const token = keyIdToken(keys);
    for (let i = storyCards.length - 1; i >= 0; i--) {
      if (storyCards[i] && keyIdToken(storyCards[i].keys) === token) {
        try {
          if (typeof removeStoryCard === "function") removeStoryCard(i);
          else storyCards.splice(i, 1);
        } catch (e) {
          try { storyCards.splice(i, 1); } catch (e2) {}
        }
      }
    }
  }

  function createOrPatchStoryCard(title, type, keys, entry, description) {
    if (isUnnamedish(title) || isUnnamedish(type) || !keys || !entry) return null;
    let card = findStoryCardByKeys(keys) || findStoryCardByTitle(title);
    const beforeLength = Array.isArray(globalThis.storyCards) ? storyCards.length : -1;

    if (!card && typeof addStoryCard === "function") {
      try {
        const created = addStoryCard(keys, entry, type);
        if (created && typeof created === "object") card = created;
        else if (typeof created === "number" && Array.isArray(globalThis.storyCards) && storyCards[created]) card = storyCards[created];
      } catch (e) {
        card = null;
      }
    }

    if (!card && Array.isArray(globalThis.storyCards) && storyCards.length > beforeLength) {
      card = storyCards[storyCards.length - 1];
    }

    if (!card && Array.isArray(globalThis.storyCards)) {
      card = {};
      storyCards.push(card);
    }

    if (!card || typeof card !== "object") return null;
    card.title = title;
    card.type = type;
    card.keys = keys;
    card.entry = entry;
    card.description = description || "";
    return card;
  }

  function syncCards() {
    const cg = ensureState();
    const owners = Object.keys(cg.cards || {});
    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      const bucket = cg.cards[owner];
      // Only live threads sync. Dormant/resolved buckets are archived in state
      // (HISTORY preserved) and must NOT be recreated as Story Cards.
      if (!cardHasContent(bucket) || !lifeStatusIsActive(bucket.status)) continue;
      const entry = renderCardEntry(bucket);
      if (!entry) continue;
      createOrPatchStoryCard(
        cardTitle(owner, bucket.status),
        CFG.LIFE_CARD_TYPE,
        storyCardTriggers(bucket),
        entry,
        renderCardDescription(bucket)
      );
    }
  }

  // Read a labeled field's value from a rendered Story Card entry. Handles the
  // compact inline form ("LABEL: value") and the older "LABEL:" + next-line form.
  function extractEntryField(entry, label) {
    const lines = String(entry || "").replace(/\r/g, "").split("\n");
    const want = label.toUpperCase() + ":";
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t.toUpperCase().indexOf(want) === 0) {
        const inline = t.slice(want.length).trim();
        if (inline) return inline;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) return lines[j].trim();
        }
      }
    }
    return "";
  }

  // Per active card: compare the INTERNAL bucket (source for injection + render)
  // against the VISIBLE Story Card entry, and flag stale (non-config) pressures.
  function cardAuditLines() {
    const cg = ensureState();
    const owners = Object.keys(cg.cards || {});
    const out = [];
    for (let i = 0; i < owners.length; i++) {
      const b = cg.cards[owners[i]];
      if (!cardHasContent(b) || !lifeStatusIsActive(b.status)) continue;
      const bP = cleanText(b.pressure), bT = cleanText(b.target);
      const card = findStoryCardByKeys(storyCardIdToken(owners[i]));
      const cP = card ? extractEntryField(card.entry, "PRESSURE") : "";
      const cT = card ? extractEntryField(card.entry, "TARGET") : "";
      const inConfig = LC.pressures.indexOf(bP.toLowerCase()) !== -1;
      const match = (cP.toLowerCase() === bP.toLowerCase() && cT.toLowerCase() === bT.toLowerCase());
      out.push("AUDIT " + owners[i] +
        " | bucket(injected): T=" + (bT || "-") + " P=" + (bP || "-") +
        " | card(visible): T=" + (cT || "-") + " P=" + (cP || "-") +
        " | source=internalCache | inConfig=" + (inConfig ? "yes" : "NO-stale") +
        " | match=" + (match ? "yes" : "NO"));
    }
    return out.length ? out.join("\n") : "AUDIT: no active cards";
  }

  function updateDebugCard() {
    if (!CFG.DEBUG) { removeStoryCardByKeys(CFG.DEBUG_CARD_KEY); return; }
    const cg = ensureState();
    const owners = Object.keys(cg.cards || {});
    let live = 0, activeLife = 0, dormant = 0, resolved = 0;
    for (let i = 0; i < owners.length; i++) {
      const b = cg.cards[owners[i]];
      const st = cleanText(b && b.status).toLowerCase();
      if (st === "dormant") { dormant++; continue; }
      if (st === "resolved") { resolved++; continue; }
      if (!cardHasContent(b)) continue;
      live++;
      if (lifeStatusIsActive(b.status)) activeLife++;
    }
    const pending = cg.pendingSeed
      ? cg.pendingSeed.actor + " -> " + cg.pendingSeed.target +
        " (" + cg.pendingSeed.pressure + ", age " +
        (cg.turn - (cg.pendingSeed.turnCreated || 0)) + ")"
      : "none";
    const activityLabel = LC.activityOff ? "Off" : ("every ~" + LC.activityTurns + " turns");
    const entry = [
      "LIFE CARDS DEBUG",
      "version: " + CFG.VERSION,
      "turn: " + (cg.turn || 0),
      "config protagonist: " + (LC.protagonist || "(none)"),
      "config cast: " + LC.characters.length + " (roster from " + LC.rosterSource + ") | pressures: " + LC.pressures.length,
      "config pacing: LIFE_CARD_INTERVAL " + activityLabel + " / cooldown " + LC.targetCooldown + " cards / cap " + LC.maxActive,
      (LC.legacyActivityUsed
        ? "NOTE: SOCIAL_ACTIVITY is deprecated and was auto-converted to LIFE_CARD_INTERVAL=" + (LC.activityOff ? 0 : LC.activityTurns) + ". Add a LIFE_CARD_INTERVAL line to silence this."
        : "config source: LIFE_CARD_INTERVAL"),
      "lastRoll: " + (cg.lastRoll || "n/a"),
      "seedSource: " + (cg.seedSource || "n/a"),
      "seedCandidates: " + ((cg.seedCandidates && cg.seedCandidates.length) ? cg.seedCandidates.join(", ") : "(none)"),
      "selectedSeed: " + (cg.selectedSeed || "(none)"),
      "seedReason: " + (cg.seedReason || "n/a"),
      "pendingSeed: " + pending,
      "lastSeedAttemptTurn: " + (cg.lastSeedAttemptTurn || 0) + " | totalLifeCards: " + (cg.seedCount || 0),
      "lastThreadReminderTurn: " + (cg.lastThreadReminderTurn || 0),
      "activeLifeCards/cap: " + activeLife + "/" + LC.maxActive,
      "sceneMode: " + LC.sceneRelevanceMode + " (" + (LC.sceneRelevanceMode === "off" ? "scene IGNORED" : LC.sceneRelevanceMode === "strict" ? "scene ENFORCED" : "scene PREFERRED") + ")",
      "protagonistInvolvement: " + LC.protagonistInvolvement + " (target-side bias; protagonist never owns a card)" + (LC.protagonist ? "" : " [no protagonist set -> normal]"),
      "sceneRelevance applied -> seed: " + (cg.seedSource === "skipped" ? "enforced(skipped)" : cg.seedSource === "sceneActors" ? "enforced" : "ignored") + " | inject: " + (LC.sceneRelevanceMode === "off" ? "ignored" : LC.sceneRelevanceMode === "strict" ? "enforced" : "preferred"),
      "injected " + (cg.lastActiveSelected || 0) + " of " + activeLife + " active | sceneSource: " + (cg.sceneSource || "?"),
      "sceneActors" + (LC.protagonistAlwaysPresent && LC.protagonist ? " (protagonist always-on)" : "") + ": " + ((cg.sceneActors && cg.sceneActors.length) ? cg.sceneActors.join(", ") : "(none)"),
      "candidateCards: " + ((cg.lastCandidateTrace && cg.lastCandidateTrace.length) ? cg.lastCandidateTrace.join(" | ") : "(none)"),
      "selectedCards / injectedCards: " + ((cg.lastSelectedTrace && cg.lastSelectedTrace.length) ? cg.lastSelectedTrace.join(" | ") : "(none)"),
      "freshThreads (marked URGENT): " + ((cg.lastFreshThreads && cg.lastFreshThreads.length) ? cg.lastFreshThreads.join(", ") : "(none)"),
      cardAuditLines(),
      "archivedLifeCards (dormant/resolved): " + dormant + "/" + resolved,
      "cards (live/total): " + live + "/" + owners.length,
      "lastOccurrence: " + (cg.recentMemory && cg.recentMemory.length ? cg.recentMemory[cg.recentMemory.length - 1] : "none")
    ].join("\n");
    createOrPatchStoryCard(
      CFG.DEBUG_CARD_TITLE,
      CFG.DEBUG_CARD_TYPE,
      CFG.DEBUG_CARD_KEY,
      entry,
      "Diagnostic only. Set DEBUG = false to disable."
    );
  }

  // Eligible actors = configured cast, minus the protagonist, minus characters
  // who already hold an active Life thread (one per character), minus characters
  // still inside their TARGET_COOLDOWN (counted in Life Cards, not turns).
  function actorPool() {
    const p = playerName();
    const cg = ensureState();
    return unique(npcRoster()).filter(function(name) {
      if (!name || name === p) return false;
      const b = cg.cards[name];
      if (b && cardHasContent(b) && lifeStatusIsActive(b.status)) return false;
      const lastIdx = cg.actorSeedIndex[name];
      if (lastIdx != null && (cg.seedCount - lastIdx) < LC.targetCooldown) return false;
      return true;
    });
  }

  function targetPool(actor) {
    const p = playerName();
    return unique([p].concat(npcRoster())).filter(function(name) {
      return name && name !== actor;
    });
  }

  // Choose a TARGET for a given (already-selected NPC) owner, applying the
  // PROTAGONIST_INVOLVEMENT bias. This only ever influences who is TARGETED; owner
  // selection (actorPool) and the never-an-owner rule are untouched. With no
  // protagonist, LC.protagonistInvolvement is forced to "normal" upstream, so this
  // behaves exactly like the original choose(targetPool(actor)).
  function chooseTarget(actor) {
    const p = playerName();
    const mode = LC.protagonistInvolvement || "normal";
    const pool = targetPool(actor);
    if (!pool.length) return "";
    const protagInPool = !!p && pool.indexOf(p) !== -1;

    if (mode === "off") {
      // Exclude the protagonist absolutely. If no NPC target remains, choose([])
      // returns "" and the caller safely skips the card (never falls back to the
      // protagonist) -- "off" means the protagonist is never targeted.
      const npcOnly = pool.filter(function(n) { return n !== p; });
      return choose(npcOnly);
    }
    if (mode === "always" && protagInPool) {
      // Use the protagonist as target when legal. (Owner stays an NPC; cooldown and
      // scene relevance are still enforced by the surrounding selection logic.)
      return p;
    }
    if (mode === "high" && protagInPool) {
      // Protagonist gets ~3x the weight of a single NPC; NPC-to-NPC still happens.
      const pairs = pool.map(function(n) { return [n, n === p ? 3 : 1]; });
      return weightedChoice(pairs);
    }
    // normal (and high/always with no eligible protagonist target): current behavior.
    return choose(pool);
  }

  function cardReason(actor, target, category) {
    const cg = ensureState();
    const actorCard = cg.cards[actor];
    if (cardHasContent(actorCard)) {
      const detail = cleanText(actorCard.event) ||
        (cleanText(actorCard.pressure) + " toward " + (cleanText(actorCard.target) || target));
      return actor + " has unresolved " + category + " pressure connected to " + target + ": " + detail;
    }
    return actor + " has enough social momentum around " + target + " for a " + category + " move.";
  }

  function seedSignature(seed) {
    return [seed.actor, seed.target, seed.category].join("|").toLowerCase();
  }

  function rememberSeed(seed) {
    const cg = ensureState();
    const sig = seedSignature(seed);
    if (cg.recentSeeds.indexOf(sig) === -1) cg.recentSeeds.push(sig);
    while (cg.recentSeeds.length > 20) cg.recentSeeds.shift();
    // Count this Life Card and stamp the actor's card index for TARGET_COOLDOWN.
    cg.seedCount = (cg.seedCount || 0) + 1;
    cg.actorSeedIndex[seed.actor] = cg.seedCount;
  }

  function momentumForIntensity(intensity) {
    if (intensity === "major") return "high";
    if (intensity === "medium") return "medium";
    return "low";
  }

  // A card is meaningful once it carries system pressure or a narrator event.
  function cardHasContent(b) {
    return !!(b && (cleanText(b.pressure) || cleanText(b.event)));
  }

  // Materialize a pressure card the moment a Life Card seed fires. The system
  // writes only the abstract pressure (TARGET / PRESSURE / MOMENTUM); it never
  // invents the specific behavior and never overwrites a narrator-authored EVENT.
  function bootstrapSeedCard(seed) {
    if (!seed) return;
    const bucket = ensureCardBucket(seed.actor);
    if (!bucket) return;

    bucket.target = seed.target;
    bucket.pressure = seed.pressure;
    bucket.momentum = seed.momentum;
    bucket.reminderCount = 0; // fresh pressure restarts the dormancy clock
    bucket.status = "active";
    bucket.createdTurn = ensureState().turn; // for FRESH PRESSURE detection in the block
    appendEventLog(bucket, "[pressure] " + seed.pressure + " toward " + seed.target + " (" + seed.momentum + ")");
  }

  // A Life card counts as "active" only in these statuses. dormant/resolved do not.
  function lifeStatusIsActive(status) {
    const list = CFG.ACTIVE_LIFE_STATUSES || ["active", "simmering", "surfaced"];
    return list.indexOf(cleanText(status).toLowerCase()) !== -1;
  }

  function countActiveLifeCards() {
    const cg = ensureState();
    const owners = Object.keys(cg.cards || {});
    let n = 0;
    for (let i = 0; i < owners.length; i++) {
      const b = cg.cards[owners[i]];
      if (cardHasContent(b) && lifeStatusIsActive(b.status)) n++;
    }
    return n;
  }


  // Dormancy ARCHIVES a thread: keep the card and HISTORY, but clear the active
  // thread fields so the character fully releases this storyline and can be
  // reseeded later with a brand-new TARGET / PRESSURE / MOMENTUM.
  function makeDormant(bucket) {
    if (!bucket) return;
    bucket.target = "";
    bucket.pressure = "";
    bucket.momentum = "";
    bucket.event = "";
    bucket.status = "dormant";
    bucket.reminderCount = 0;
    // eventLog (HISTORY) is intentionally left untouched.

    // Drop the Story Card; the bucket + HISTORY remain in state as the archive.
    removeStoryCardByKeys(storyCardIdToken(bucket.owner));
  }

  function maybeCreateSeed(text) {
    const cg = ensureState();
    if (!CFG.AUTONOMY_ENABLED || LC.activityOff) { cg.lastRoll = "disabled (Social Activity Off)"; return null; }

    // First-card turn gate: no Life Card until the story has had time to form.
    if (cg.turn < CFG.MIN_TURN_BEFORE_FIRST_SEED) {
      cg.lastRoll = "blocked: before first card turn";
      return null;
    }

    if (cg.pendingSeed && cg.turn - (cg.pendingSeed.turnCreated || 0) > CFG.AUTONOMY_MAX_PENDING_AGE) {
      cg.pendingSeed = null;
    }
    if (cg.pendingSeed) {
      cg.lastRoll = "pending reused: " + cg.pendingSeed.actor + " -> " + cg.pendingSeed.target;
      return cg.pendingSeed;
    }
    // HARD SLOT CAP: while the active slots are full, do NOT roll, seed, or replace.
    // A new card is only considered after an active card finishes its full reminder
    // cycle and archives (dormant), which frees a slot.
    if (countActiveLifeCards() >= LC.maxActive) {
      cg.lastRoll = "blocked: slot cap full (" + countActiveLifeCards() + "/" + LC.maxActive + ") -- waiting for a card to archive";
      return null;
    }
    // Pacing: the FIRST card ever (seedCount 0) ignores the interval and fires as
    // soon as MIN_TURN allows. After that, wait LIFE_CARD_INTERVAL turns since the
    // last SUCCESSFUL card, then retry every turn until one is created (a failed
    // attempt does not waste the interval). lastSeedAttemptTurn is stamped on success.
    if ((cg.seedCount || 0) > 0 && cg.turn - (cg.lastSeedAttemptTurn || 0) < LC.activityTurns) {
      cg.lastRoll = "waiting (next attempt ~turn " + ((cg.lastSeedAttemptTurn || 0) + LC.activityTurns) + ")";
      return null;
    }

    // Scene-aware OWNER selection. The owner holds the pressure, so in strict mode it
    // must be an NPC currently in scene; hybrid prefers in-scene owners but falls back
    // to the full roster; off uses the full roster. (Protagonist is never an owner, so
    // the protagonist being always-present does not make every NPC eligible.)
    // Scene eligibility (strict/hybrid): a card is eligible if AT LEAST ONE side --
    // owner OR target -- is a NON-protagonist NPC in scene. The other side may be
    // off-scene (owner expresses pressure toward an absent target; or others react to
    // a present target whose owner is absent). The always-present protagonist never
    // makes a card eligible by itself:
    //   NPC -> NPC:          owner OR target in scene
    //   NPC -> Protagonist:  owner must be in scene
    //   Protagonist -> NPC:  N/A (protagonist is never an owner)
    const mode = LC.sceneRelevanceMode || "strict";
    const scene = cg.sceneActors || [];
    const p = playerName();
    const fullActors = actorPool();
    let actor = null, target = null, seedSource = "fullRoster";
    let sceneNPCs = [];

    if (mode === "strict" || mode === "hybrid") {
      sceneNPCs = unique(npcRoster()).filter(function(n) { return n !== p && scene.indexOf(n) !== -1; });
      if (sceneNPCs.length) {
        seedSource = "sceneActors";
        const anchor = choose(sceneNPCs);                        // the present side
        const anchorCanOwn = fullActors.indexOf(anchor) !== -1;  // eligible as owner?
        const otherOwners = fullActors.filter(function(n) { return n !== anchor; });
        // Vary which side is present: owner-present vs target-present.
        // For "always", prefer the in-scene NPC as OWNER so chooseTarget can make the
        // protagonist the TARGET while keeping the card scene-relevant (owner in scene).
        // If the anchor cannot own, we fall through to the NPC->anchor branch below
        // (a safe NPC-to-NPC fallback that still respects scene relevance).
        const anchorAsOwner = anchorCanOwn && (LC.protagonistInvolvement === "always" || otherOwners.length === 0 || Math.random() < 0.5);
        if (anchorAsOwner) {
          actor = anchor;
          target = chooseTarget(actor);
        } else if (otherOwners.length) {
          target = anchor;
          actor = choose(otherOwners);
        } else if (anchorCanOwn) {
          actor = anchor;
          target = chooseTarget(actor);
        }
      }
      if ((!actor || !target) && mode === "strict") {
        cg.seedSource = "skipped";
        cg.seedCandidates = sceneNPCs.slice(0, 12);
        cg.selectedSeed = "(none)";
        cg.seedReason = "strict: no owner OR target in scene";
        cg.lastRoll = "attempt: no scene-eligible pair (strict)";
        return null;
      }
      // hybrid with no scene pair falls through to the full roster below.
    }

    if (!actor) {
      if (!fullActors.length) {
        cg.seedSource = seedSource; cg.seedCandidates = fullActors.slice(0, 12);
        cg.selectedSeed = "(none)"; cg.seedReason = "no eligible owners";
        cg.lastRoll = "attempt: no eligible actors";
        return null;
      }
      actor = choose(fullActors);
      target = chooseTarget(actor);
    }
    if (!target) {
      cg.seedSource = seedSource;
      cg.lastRoll = "attempt: no targets for " + actor;
      cg.selectedSeed = "(none)"; cg.seedReason = "no targets for " + actor;
      return null;
    }

    cg.seedSource = seedSource;
    cg.seedCandidates = (seedSource === "sceneActors" ? sceneNPCs : fullActors).slice(0, 12);
    cg.selectedSeed = actor + " -> " + target;
    const ownerIn = actor !== p && scene.indexOf(actor) !== -1;
    const tgtIn = target !== p && scene.indexOf(target) !== -1;
    cg.seedReason = (seedSource === "sceneActors")
      ? (ownerIn && tgtIn ? "owner & target in scene" : ownerIn ? "owner in scene" : "target in scene")
      : "off-scene seed allowed (mode=" + mode + ")";
    const pressure = choose(LC.pressures) || "tension";
    const intensity = weightedChoice([["small", 65], ["medium", 28], ["major", 7]]);

    let seed = {
      id: "seed-" + cg.turn + "-" + randomInt(100000),
      turnCreated: cg.turn,
      actor: actor,
      target: target,
      category: pressure,
      intensity: intensity,
      pressure: pressure,
      momentum: momentumForIntensity(intensity),
      reason: cardReason(actor, target, pressure)
    };

    if (cg.recentSeeds.indexOf(seedSignature(seed)) !== -1) { cg.lastRoll = "attempt: duplicate, skipped"; return null; }
    cg.pendingSeed = seed;
    cg.lastSeedAttemptTurn = cg.turn; // start the next interval only on SUCCESS
    cg.lastRoll = "LIFE CARD " + actor + " -> " + target + " [" + pressure + "/" + intensity + "]";
    rememberSeed(seed);
    bootstrapSeedCard(seed);
    return seed;
  }

  function buildContextDirective(text) {
    const seed = maybeCreateSeed(text);
    if (!seed) return "";
    // Compact: a new pressure formed. Let it color behavior; the narrator MAY record
    // a concrete development with a hidden memory block (never auto-control the player).
    return "\n\n<LC_PRIVATE>\n" +
      "New social pressure: " + seed.actor + " feels " + (seed.pressure || seed.category) +
      " toward " + seed.target + ". Let it shape behavior naturally; do not state the label.\n" +
      "If something concrete happens with " + seed.actor + ", record it after the story on its own lines. The system removes it before the player sees it, so it will not break the scene. Minimum is OWNER + OCCURRENCE; OWNER_THOUGHT and STATUS are optional (STATUS defaults to active):\n" +
      "<LC_MEMORY>\n" +
      "OWNER: " + seed.actor + "\n" +
      "OCCURRENCE: one sentence of what happened\n" +
      "OWNER_THOUGHT: (optional) brief first-person or close-third thought from " + seed.actor + "\n" +
      "STATUS: (optional) active | resolved\n" +
      "</LC_MEMORY>\n" +
      "</LC_PRIVATE>";
  }

  // Most recent concrete development for a card, kept to one compact line.
  function latestThreadLine(b) {
    let latest = cleanText(b.event);
    if (!latest && Array.isArray(b.eventLog) && b.eventLog.length) {
      latest = cleanText(b.eventLog[b.eventLog.length - 1]);
    }
    if (latest.length > 160) latest = latest.slice(0, 157) + "...";
    return latest;
  }

  // A thread is scene-relevant when a NON-protagonist participant is in scene.
  // (The protagonist is always "present", so target-is-protagonist alone does not
  // count; the NPC owner must be present.)
  function isSceneRelevant(b, scene) {
    const p = playerName();
    const owner = cleanName(b.owner);
    const tgt = cleanName(b.target);
    const ownerIn = owner && owner !== p && scene.indexOf(owner) !== -1;
    const targetIn = tgt && tgt !== p && scene.indexOf(tgt) !== -1;
    return !!(ownerIn || targetIn);
  }

  // Always-on block. Injects compact full details of the selected active Life Cards
  // every turn. SCENE_RELEVANCE_MODE controls selection: strict = scene-relevant only,
  // off = any active, hybrid = scene-relevant first then fill.
  function buildActiveThreadsBlock() {
    const cg = ensureState();
    const scene = cg.sceneActors || [];
    const mode = LC.sceneRelevanceMode || "strict";
    const owners = Object.keys(cg.cards || {});

    const active = [];
    for (let i = 0; i < owners.length; i++) {
      const b = cg.cards[owners[i]];
      if (!cardHasContent(b) || !lifeStatusIsActive(b.status)) continue;
      active.push({ owner: owners[i], bucket: b });
    }
    if (!active.length) { cg.lastCandidateTrace = []; cg.lastSelectedTrace = []; cg.lastActiveSelected = 0; return ""; }

    // Debug trace: every active card + whether it is scene-relevant this turn.
    cg.lastCandidateTrace = active.map(function(c) {
      return c.owner + "->" + (cleanText(c.bucket.target) || "?") +
        (isSceneRelevant(c.bucket, scene) ? " [in-scene]" : " [off-scene]");
    });

    let selected;
    if (mode === "off") {
      selected = active.slice(0, LC.maxActive);
    } else if (mode === "hybrid") {
      const relevant = active.filter(function(c) { return isSceneRelevant(c.bucket, scene); });
      const rest = active.filter(function(c) { return !isSceneRelevant(c.bucket, scene); });
      selected = relevant.concat(rest).slice(0, LC.maxActive);
    } else { // strict
      selected = active.filter(function(c) { return isSceneRelevant(c.bucket, scene); }).slice(0, LC.maxActive);
    }
    cg.lastActiveSelected = selected.length;
    cg.lastSelectedTrace = selected.map(function(c) {
      return c.owner + "->" + (cleanText(c.bucket.target) || "?");
    });
    if (!selected.length) return "";

    // Render each card as a distinct multi-line block (more salient than one line).
    const renderEntry = function(c) {
      const b = c.bucket;
      let e = "OWNER: " + c.owner +
        "\nTARGET: " + (cleanText(b.target) || "someone") +
        "\nPRESSURE: " + (cleanText(b.pressure) || "unspoken pressure") +
        "\nMOMENTUM: " + (cleanText(b.momentum) || "low") +
        "\nSTATUS: " + (cleanText(b.status) || "active");
      const latest = latestThreadLine(b);
      if (latest) e += "\nLATEST: " + latest;
      return e;
    };

    // Split: a card is FRESH for FRESH_THREAD_WINDOW turns after it fires.
    const fresh = [], ongoing = [];
    for (let i = 0; i < selected.length; i++) {
      const created = (typeof selected[i].bucket.createdTurn === "number") ? selected[i].bucket.createdTurn : 0;
      if ((cg.turn - created) <= CFG.FRESH_THREAD_WINDOW) fresh.push(selected[i]);
      else ongoing.push(selected[i]);
    }
    cg.lastFreshThreads = fresh.map(function(c) { return c.owner; });

    // Write-back is a periodic CHECKPOINT, shown only on reminder/surface turns (the
    // same cadence as advanceThreadDormancy) -- NOT every turn. Framed as a look-back so
    // a development from a recent turn can still be recorded here. Conditional only:
    // never required, no no-op blocks (the owner && event gate still drops empty ones).
    const checkpointTurn = isCheckpointTurn();
    if (checkpointTurn) cg.lastCheckpointTurn = cg.turn; // stamp the checkpoint's OWN counter

    // Forceful, active framing (Dynamic Large responds better when the card reads as a
    // live scene driver, not background info). Not subtle.
    let body = "ACTIVE LIFE THREADS\n" +
      "Use these NOW. Each active life thread below is influencing the CURRENT story and affecting this scene right now -- let them drive the characters' behavior, choices, dialogue, and reactions.\n";

    // PRIMARY: the Life Card details lead. This is story-driving context the narrator
    // should USE in the prose. (Front-loading the write-back task made the model
    // deprioritize the card, so the card and its nudge always come first now.)
    if (fresh.length) {
      body += "\nFRESH PRESSURE (new this turn -- treat as CURRENT and let it shape THIS scene):\n" +
        fresh.map(renderEntry).join("\n\n") + "\n";
    }
    if (ongoing.length) {
      body += "\nONGOING THREADS:\n" + ongoing.map(renderEntry).join("\n\n") + "\n";
    }

    // PRIMARY: single forceful story-driver nudge. Not subtle.
    body += (mode === "strict")
      ? "\nUse these now. Each active life thread is affecting this scene -- let it create visible consequences: dialogue, gossip, tension, attraction, avoidance, conflict, reactions, choices, relationship shifts. Do not state the labels.\n"
      : "\nUse these now. These pressures are live and influencing the current story even when the characters are off-screen -- let them surface as visible consequences: dialogue, gossip, shifting moods, attitudes, alliances, tension, attraction, avoidance, conflict, reactions, choices, relationship shifts. Do not state the labels.\n";

    // SECONDARY: trailing write-back, only on reminder/checkpoint turns, and visibly
    // SEPARATED from the story context above (a divider + "does not change the story")
    // so it reads as optional bookkeeping, never as competing with using the card.
    // Conditional only; the owner && event gate still drops empty/no-occurrence blocks.
    if (checkpointTurn) {
      const triggerList = selected.map(function(c) {
        const b = c.bucket;
        return c.owner + " (" + (cleanText(b.pressure) || "pressure") + " toward " + (cleanText(b.target) || "someone") + ")";
      }).join("; ");
      body += "\n---\n" +
        "Separate bookkeeping (does NOT change the story above, and is not part of the scene): if any active Life Card has visibly developed recently, then AFTER the story add one hidden block. Only if it actually developed -- otherwise skip it entirely. The system removes the block before the player sees it.\n" +
        "Minimum is OWNER + one OCCURRENCE line. OWNER_THOUGHT and STATUS are optional (STATUS defaults to active).\n" +
        "<LC_MEMORY>\n" +
        "OWNER: an exact owner name from the list above\n" +
        "OCCURRENCE: one sentence of what happened\n" +
        "OWNER_THOUGHT: (optional) brief first-person or close-third thought from that owner\n" +
        "STATUS: (optional) active | resolved\n" +
        "</LC_MEMORY>\n" +
        "Example (fictional -- copy the FORMAT, not these names; use an owner from above):\n" +
        "<LC_MEMORY>\n" +
        "OWNER: Mara\n" +
        "OCCURRENCE: Mara cut Jonah off mid-sentence and turned her back on him.\n" +
        "OWNER_THOUGHT: He always has to be right -- I'm done giving him the last word.\n" +
        "STATUS: active\n" +
        "</LC_MEMORY>\n" +
        "Cards that may have developed: " + triggerList + ".\n";
    }

    return "\n\n<LC_PRIVATE>\n" +
      (LC.forceActiveCardTrigger && CFG.ACTIVE_SHARED_TRIGGER ? CFG.ACTIVE_SHARED_TRIGGER + "\n" : "") +
      body +
      "</LC_PRIVATE>";
  }

  // True when THIS turn is a write-back CHECKPOINT turn -- on the CHECKPOINT_EVERY
  // cadence (its OWN counter cg.lastCheckpointTurn, independent of dormancy), and only
  // when at least one active (non-dormant/resolved) card exists. READ-ONLY: it does NOT
  // advance the counter, age cards, or change dormancy. The caller stamps
  // cg.lastCheckpointTurn when it actually shows the checkpoint. Does not affect lifespan.
  function isCheckpointTurn() {
    const cg = ensureState();
    if ((cg.turn - (cg.lastCheckpointTurn || 0)) < (LC.checkpointEvery || CFG.CHECKPOINT_EVERY)) return false;
    const owners = Object.keys(cg.cards || {});
    for (let i = 0; i < owners.length; i++) {
      const b = cg.cards[owners[i]];
      if (!cardHasContent(b)) continue;
      const st = cleanText(b.status).toLowerCase();
      if (st === "resolved" || st === "dormant") continue;
      return true;
    }
    return false;
  }

  // Dormancy progression on the THREAD_REMINDER_EVERY cadence (its own counter,
  // cg.lastThreadReminderTurn). Counts appearances and archives threads that go stale.
  // INDEPENDENT of the write-back checkpoint cadence. Injects NO context text.
  function advanceThreadDormancy() {
    const cg = ensureState();
    if (cg.turn - (cg.lastThreadReminderTurn || 0) < (LC.threadReminderEvery || CFG.THREAD_REMINDER_EVERY)) return;

    const owners = Object.keys(cg.cards || {});
    const candidates = [];
    for (let i = 0; i < owners.length; i++) {
      const b = cg.cards[owners[i]];
      if (!cardHasContent(b)) continue;
      const st = cleanText(b.status).toLowerCase();
      if (st === "resolved" || st === "dormant") continue;
      candidates.push(b);
    }
    if (!candidates.length) return;

    cg.lastThreadReminderTurn = cg.turn;
    const show = candidates.slice(0, CFG.THREAD_REMINDER_MAX);
    for (let i = 0; i < show.length; i++) {
      const b = show[i];
      b.reminderCount = (Number(b.reminderCount) || 0) + 1;
      if (b.reminderCount >= CFG.THREAD_REMINDERS_BEFORE_DORMANT) makeDormant(b);
    }
  }

  function seedAppearsInOutput(seed, outputText) {
    if (!seed || !outputText) return false;
    if (!containsWholeWord(outputText, seed.actor)) return false;
    if (seed.target === playerName()) return true;
    return containsWholeWord(outputText, seed.target);
  }

  function maybeAutoCompleteOnscreenSeed(outputText) {
    if (!CFG.AUTO_COMPLETE_ONSCREEN_SEEDS) return false;

    const cg = ensureState();
    const seed = cg.pendingSeed;
    if (!seed) return false;
    if (!seedAppearsInOutput(seed, outputText)) return false;

    const bucket = ensureCardBucket(seed.actor);
    if (!bucket) return false;

    // The narrator showed actor + target but wrote no memory. Keep the abstract
    // pressure card and just mark it active. Do NOT invent canned event text;
    // a story-specific EVENT only ever comes from a narrator memory block.
    bucket.target = seed.target;
    if (!cleanText(bucket.pressure)) bucket.pressure = seed.pressure;
    if (!cleanText(bucket.momentum)) bucket.momentum = seed.momentum;
    bucket.status = "active";

    appendEventLog(bucket, "[active] " + seed.pressure + " toward " + seed.target + " is in play.");

    cg.pendingSeed = null;
    cg.lastRoll = "AUTO active: " + seed.actor + " / " + seed.pressure + " -> " + seed.target;
    return true;
  }

  function parseMemoryBlock(block) {
    const lines = String(block || "").replace(/\r/g, "").split("\n");
    const data = {};
    let current = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const idx = line.indexOf(":");
      if (idx !== -1) {
        const key = line.slice(0, idx).trim().toLowerCase();
        const value = line.slice(idx + 1).trim();
        if (["owner", "event", "occurrence", "pressure", "momentum", "target", "status", "log", "owner_thought"].indexOf(key) !== -1) {
          current = key;
          data[current] = value;
          continue;
        }
      }
      if (current && line.trim()) {
        data[current] = cleanText((data[current] || "") + "\n" + line.trim());
      }
    }
    data.owner = cleanName(data.owner);
    // OCCURRENCE is the preferred label; EVENT remains a backwards-compatible alias.
    data.event = cleanText(data.occurrence || data.event);
    data.pressure = cleanText(data.pressure);
    data.target = cleanName(data.target);
    data.momentum = cleanText(data.momentum).toLowerCase();
    data.status = cleanText(data.status || "active").toLowerCase();
    data.log = cleanText(data.log || data.event);
    // Optional narrator-authored first-person interior line. Display-only; the engine
    // never reads it for targeting, pressure, momentum, status, or any logic.
    data.owner_thought = cleanText(data.owner_thought);
    return data;
  }

  function extractBlocks(text, tag) {
    const blocks = [];
    const open = "<" + tag + ">";
    const close = "</" + tag + ">";
    let src = String(text || "");
    let start = src.indexOf(open);
    while (start !== -1) {
      const end = src.indexOf(close, start + open.length);
      if (end === -1) break;
      blocks.push(src.slice(start + open.length, end));
      start = src.indexOf(open, end + close.length);
    }
    return blocks;
  }

  function stripBlocks(text) {
    let out = String(text || "");
    // LC_* are current; CG_* are legacy and still stripped so an in-flight story
    // that emits an old tag never leaks it into the visible output.
    const tags = ["LC_PRIVATE", "LC_SEED", "LC_MEMORY", "LC_CARDS", "CG_PRIVATE", "CG_SEED", "CG_MEMORY", "CG_CARDS"];
    for (let t = 0; t < tags.length; t++) {
      const open = "<" + tags[t] + ">";
      const close = "</" + tags[t] + ">";
      let guard = 0;
      while (guard < 20) {
        const start = out.indexOf(open);
        if (start === -1) break;
        const end = out.indexOf(close, start + open.length);
        if (end === -1) {
          out = out.slice(0, start);
          break;
        }
        out = out.slice(0, start) + out.slice(end + close.length);
        guard++;
      }
    }
    return cleanText(out);
  }

  function stripSelectedBlocks(text, tags) {
    let out = String(text || "");
    for (let t = 0; t < tags.length; t++) {
      const open = "<" + tags[t] + ">";
      const close = "</" + tags[t] + ">";
      let guard = 0;
      while (guard < 20) {
        const start = out.indexOf(open);
        if (start === -1) break;
        const end = out.indexOf(close, start + open.length);
        if (end === -1) {
          out = out.slice(0, start);
          break;
        }
        out = out.slice(0, start) + out.slice(end + close.length);
        guard++;
      }
    }
    return out;
  }

  // ==========================================================================
  // THOUGHT CARD SYSTEM
  // --------------------------------------------------------------------------
  // Part of LIVING CHARACTERS, a LivingNarratives project.
  // (https://github.com/LivingNarratives/LivingCharacters)
  //
  // This module belongs to Living Characters. Thought Cards are a feature of
  // Living Characters, kept deliberately separate from the Life Card engine.
  //
  // WHAT THOUGHT CARDS ARE:
  //   Player-facing thought journals. One numbered, human-readable log per
  //   character (titled "Name - Thoughts"; a temporary 💭 marks recent updates) to read
  //   to follow a character's emotional progression over many turns.
  //
  // WHAT THOUGHT CARDS ARE NOT:
  //   - NOT memory. NOT a brain. NOT Inner Self.
  //   - They do NOT enter the story context (the Thought Card uses a non-matching
  //     key, so the AI Dungeon front-end never injects it).
  //   - They are NOT read by the AI narrator.
  //   - They do NOT affect character behavior, Life Card creation, targeting,
  //     pressure, momentum, dormancy, selection, or any story logic.
  //
  // WHAT THIS MODULE DOES (the entire job):
  //   1. ASK   - inject ONE temporary first-person parenthetical request into
  //              context (the only thing this system ever puts in context).
  //   2. CAPTURE- read that leading parenthetical back from the model's output
  //              and strip it from the visible story.
  //   3. STORE - append it (numbered) to the character's Thought Card for the
  //              player to read later. Nothing reads it back.
  //
  // The PARENTHETICAL REQUEST is the only temporary instruction injected into
  // context. The stored Thought Card itself is never injected (non-matching key).
  // No XML, no LC_MEMORY, no write-back blocks, no detectors. Runs independently
  // of Life Cards (a character can have thoughts with no active Life Card).
  // ==========================================================================
  const THOUGHT_KEYS = ["thoughts_enabled", "thought_characters", "thought_interval", "thought_formation_chance", "thought_scene_mode"];

  // THOUGHT CARDS CONFIG
  // The editable Story Card that controls the separate Thought Card system. It is
  // distinct from the LIVING CHARACTERS CONFIG (Life Cards) card on purpose, so the
  // two systems never share settings. Defaults below are conservative and opt-in.
  function defaultThoughtConfigEntry() {
    return [
      "THOUGHT CARDS (separate from Life Cards)",
      "",
      "Important:",
"Thought Cards are not compatible with AI Dungeon's Optimized Context feature.",
"Disable Optimized Context when using Thought Cards.",
      "",
      "THOUGHTS_ENABLED:",
      "false",
      "",
      "THOUGHT_CHARACTERS:",
      "( one name per line )",
      "",
      "THOUGHT_INTERVAL:",
      "5",
      "",
      "THOUGHT_FORMATION_CHANCE:",
      "50",
      "",
      "THOUGHT_SCENE_MODE:",
      "scene"
    ].join("\n");
  }

  function ensureThoughtConfigCard() {
    const existing = findStoryCardByKeys(CFG.THOUGHT_CONFIG_CARD_KEY) || findStoryCardByTitle(CFG.THOUGHT_CONFIG_CARD_TITLE);
    if (existing) return existing;
    return createOrPatchStoryCard(
      CFG.THOUGHT_CONFIG_CARD_TITLE,
      CFG.THOUGHT_CONFIG_CARD_TYPE,
      CFG.THOUGHT_CONFIG_CARD_KEY,
      defaultThoughtConfigEntry(),
      "Thought Cards are a player-facing journal. They never enter the story context."
    );
  }

  function buildThoughtConfig() {
    ensureThoughtConfigCard();
    const card = findStoryCardByKeys(CFG.THOUGHT_CONFIG_CARD_KEY) || findStoryCardByTitle(CFG.THOUGHT_CONFIG_CARD_TITLE);
    const sections = parseConfigText(card && card.entry, THOUGHT_KEYS);
    const enabled = toBoolOr(configFirst(sections, "thoughts_enabled", null), CFG.THOUGHTS_ENABLED_DEFAULT);
    const characters = configList(sections, "thought_characters");
    const interval = Math.max(1, toIntOr(configFirst(sections, "thought_interval", CFG.THOUGHT_INTERVAL_DEFAULT), CFG.THOUGHT_INTERVAL_DEFAULT));
    const chance = Math.max(0, Math.min(100, toIntOr(configFirst(sections, "thought_formation_chance", CFG.THOUGHT_CHANCE_DEFAULT), CFG.THOUGHT_CHANCE_DEFAULT)));
    const maxThoughts = CFG.MAX_THOUGHTS_DEFAULT; // hardcoded 10; NOT a user config option
    // THOUGHT_SCENE_MODE: scene (default) | recent | roster. Validated; bad values ->
    // default "scene". Thought scene relevance is SEPARATE from Life Card scene relevance:
    // it only decides which character may get a journal entry, and must not affect Life
    // Card targeting, pressure selection, momentum, or story logic.
    let sceneMode = String(configFirst(sections, "thought_scene_mode", CFG.THOUGHT_SCENE_MODE_DEFAULT)).toLowerCase().replace(/\s+/g, "");
    if (["scene", "recent", "roster"].indexOf(sceneMode) === -1) sceneMode = CFG.THOUGHT_SCENE_MODE_DEFAULT;
    return { enabled: enabled, characters: characters, interval: interval, chance: chance, maxThoughts: maxThoughts, sceneMode: sceneMode };
  }

  // Separate state slice -- never touches chaosGoblinV2 (Life Card state).
  function ensureThoughtState() {
    if (!globalThis.state || typeof state !== "object") globalThis.state = {};
    if (!state.livingThoughts || typeof state.livingThoughts !== "object") {
      state.livingThoughts = { version: CFG.VERSION, lastThoughtTurn: 0, pendingChar: "", byChar: {}, markedChar: "", markedTurn: 0 };
    }
    const ts = state.livingThoughts;
    if (!ts.byChar || typeof ts.byChar !== "object") ts.byChar = {};
    if (typeof ts.lastThoughtTurn !== "number") ts.lastThoughtTurn = 0;
    if (typeof ts.markedChar !== "string") ts.markedChar = "";   // 💭 "recently updated" marker
    if (typeof ts.markedTurn !== "number") ts.markedTurn = 0;
    return ts;
  }

  // Stable, non-matching key for lookup/recreation (UNCHANGED: lc-thoughts:name).
  function thoughtCardToken(name) {
    return CFG.THOUGHT_CARD_KEY_PREFIX + keyName(name);
  }

  // Character-first display title: "Name - Thoughts", with a TEMPORARY "💭 " marker
  // prepended while the card is recently updated. The KEY (above) identifies the card,
  // so adding/removing the marker just safely re-titles the same existing card.
  function thoughtCardTitle(name, marked) {
    return (marked ? CFG.THOUGHT_MARKER + " " : "") + name + CFG.THOUGHT_CARD_TITLE_SUFFIX;
  }

  // Thought Card: "Name - Thoughts" (temporary "💭 " prepended while recently updated)
  //   Purpose:     a numbered, player-readable thought journal for one character.
  //   Not purpose: not memory, not a brain, not context, not narrator guidance,
  //                not a logic source.
  // Render a character's Thought Card from the stored list. The keys are a
  // non-matching token (CFG.THOUGHT_CARD_KEY_PREFIX + name, no plain-name trigger),
  // so the AI Dungeon front-end never matches it against story text and the card is
  // NEVER injected into context. Type is "Custom" purely for player-side organization.
  function syncThoughtCard(name, TC, marked) {
    const ts = ensureThoughtState();
    const list = Array.isArray(ts.byChar[name]) ? ts.byChar[name] : [];
    const lines = [];
    for (let i = 0; i < list.length; i++) lines.push((i + 1) + ". " + list[i]);
    const entry = lines.length ? lines.join("\n") : "(no thoughts yet)";
    createOrPatchStoryCard(
      thoughtCardTitle(name, !!marked), // "Name - Thoughts" (+ 💭 while recently updated)
      CFG.THOUGHT_CARD_TYPE,
      thoughtCardToken(name),     // stable key: lc-thoughts:name (UNCHANGED) -- re-titling is safe
      entry,
      ""                          // Notes left blank for release
    );
  }

  // Append a thought (numbered) and keep only the most recent maxThoughts. No overwrite,
  // no keys, no history beyond the capped list.
  function appendThought(name, text, TC) {
    const ts = ensureThoughtState();
    name = cleanName(name);
    text = cleanText(text);
    if (!name || !text) return false;
    if (!Array.isArray(ts.byChar[name])) ts.byChar[name] = [];
    const arr = ts.byChar[name];
    if (arr.length && arr[arr.length - 1] === text) return false; // skip exact consecutive dup
    arr.push(text);
    const max = (TC && TC.maxThoughts) || CFG.MAX_THOUGHTS_DEFAULT;
    while (arr.length > max) arr.shift();
    // Visual activity marker: 💭 moves to the card that just updated. Clear it off the
    // previously-marked card (if a different one), then mark this one. (Also clears on a
    // timer; see expireThoughtMarker.) Display-only -- does not touch Life Cards.
    if (ts.markedChar && ts.markedChar !== name) syncThoughtCard(ts.markedChar, TC, false);
    ts.markedChar = name;
    ts.markedTurn = (ensureState().turn) || 0;
    syncThoughtCard(name, TC, true);
    return true;
  }

  // Clear the 💭 marker after THOUGHT_MARKER_TURNS turns so it reads as "recent" activity
  // and comes back down on its own. Runs once per context turn; re-titles one card at most.
  function expireThoughtMarker() {
    const ts = ensureThoughtState();
    if (!ts.markedChar) return;
    const turn = (ensureState().turn) || 0;
    if ((turn - (ts.markedTurn || 0)) >= CFG.THOUGHT_MARKER_TURNS) {
      syncThoughtCard(ts.markedChar, buildThoughtConfig(), false); // drop the 💭
      ts.markedChar = "";
    }
  }

  // Candidate thought-characters for THIS turn, per THOUGHT_SCENE_MODE.
  // Thought Cards are journals of what characters are thinking in/around the CURRENT
  // story moment, so by default only scene-relevant characters are eligible. There is
  // NO silent fallback to the full roster -- if nobody relevant is present, the caller
  // generates nothing this turn (an off-screen thought feels disconnected/confusing).
  //   scene  -> ONLY characters detected in the current scene (tight trailing window).
  //   recent -> characters in the wider recent-scene window (current + just-mentioned).
  //   roster -> ANY configured thought character (opt-in; intentional off-screen/"chaos"
  //             thoughts). This is the ONLY mode that ignores scene relevance.
  // Detection mirrors the Life Card scene detector (whole-word name match on the recent
  // story text), but uses the THOUGHT roster and its OWN window -- fully separate from
  // Life Card scene relevance.
  function thoughtCandidates(TC, contextText) {
    // Thought Cards are player-facing journals, so they should only come from
    // scene-relevant characters. This prevents disconnected off-screen thoughts from
    // random roster characters (e.g. a thought appearing for someone not in the scene).
    const roster = unique(TC.characters || []);
    if (!roster.length) return [];
    // THOUGHT_SCENE_MODE handling:
    //   roster -> opt-in off-screen/"chaos" mode: ANY configured thought character.
    //             This is the ONLY mode that skips the scene-relevance gate.
    if (TC.sceneMode === "roster") return roster;
    const recent = recentSceneText(contextText);  // history tail (up to SCENE_SCAN_CHARS)
    //   scene  -> tight CURRENT-scene window (default).
    //   recent -> wider recent-scene window (current + just-mentioned).
    const tight = recent.length > CFG.THOUGHT_SCENE_TIGHT_CHARS ? recent.slice(-CFG.THOUGHT_SCENE_TIGHT_CHARS) : recent;
    const text = (TC.sceneMode === "recent") ? recent : tight;
    // Fallback prevention: do NOT fall back to the full roster unless THOUGHT_SCENE_MODE
    // is explicitly "roster". If nobody is scene-relevant, return [] and the caller makes
    // no thought this turn -- an off-screen thought would feel disconnected.
    return roster.filter(function(n) { return containsWholeWord(text, n); });
  }

  // Decide whether to fire a thought this turn; if so, select a character, stamp the
  // attempt, and return the ASK string (LC_PRIVATE-wrapped) to append to context.
  // Sets ts.pendingChar for the output hook. Independent of Life Cards.
  function buildThoughtAsk(contextText) {
    const ts = ensureThoughtState();
    ts.pendingChar = "";
    const TC = buildThoughtConfig();
    if (!TC.enabled || !TC.characters.length) return "";
    const turn = (ensureState().turn) || 0;
    if ((turn - (ts.lastThoughtTurn || 0)) < TC.interval) return ""; // interval gate
    if (randomInt(100) >= TC.chance) return "";                      // chance gate
    const cands = thoughtCandidates(TC, contextText);               // scene-relevant only
    if (!cands.length) return "";                                    // nobody relevant -> no thought
    const name = choose(cands);
    ts.pendingChar = name;
    ts.lastThoughtTurn = turn;
    // Simple, reliable ask: ONE leading first-person parenthetical, then the story.
    // Parenthetical capture is the only thought mechanism -- no LC_MEMORY/XML, no fallback
    // formats, no validation.
    return "\n\n<LC_PRIVATE>\n" +
      "Begin your reply with ONE short parenthetical: " + name + "'s own private thought right now, in first person (I / me / my), one sentence. Then continue the story normally. The parenthetical is hidden from the player automatically. Format: (I ...)\n" +
      "</LC_PRIVATE>";
  }

  // Output-hook capture: ONLY when a thought was asked this turn. Captures a single
  // LEADING parenthetical (optionally stripping a "Name:" prefix), appends it to the
  // character's Thought Card, and strips it from the visible story. No leading
  // parenthetical -> output untouched. Light only; never touches Life Cards.
  function captureThought(original) {
    const ts = ensureThoughtState();
    const name = ts.pendingChar;
    if (!name) return original;
    const m = /^\s*\(([^)]*)\)/.exec(original);
    if (!m) return original;
    const t = cleanText(m[1]).replace(/^[A-Za-z][\w '\-]{0,30}:\s*/, "").trim();
    if (!t) return original;
    appendThought(name, t, buildThoughtConfig());
    return original.slice(m[0].length); // strip the leading parenthetical only
  }

  function handleOutput(rawText) {
    const original = String(rawText || "");
    const parseSource = stripSelectedBlocks(original, ["LC_PRIVATE", "LC_SEED", "LC_CARDS", "CG_PRIVATE", "CG_SEED", "CG_CARDS"]);
    // Current tag is LC_MEMORY; also accept legacy CG_MEMORY from in-flight stories.
    let memoryBlocks = extractBlocks(parseSource, "LC_MEMORY");
    if (!memoryBlocks.length) memoryBlocks = extractBlocks(parseSource, "CG_MEMORY");
    const cg = ensureState();
    let parsedMemory = false;

    if (memoryBlocks.length) {
      const memory = parseMemoryBlock(memoryBlocks[0]);
      if (memory.owner && memory.event) {
        applyMemory(memory);
        parsedMemory = true;
        cg.lastRoll = "MEMORY parsed: " + memory.owner + " (" + memory.status + ")";
      } else {
        cg.lastRoll = "MEMORY block seen but unparseable (owner/event missing)";
      }
    }

    // Safety net: if the narrator used an on-screen seed but skipped <LC_MEMORY>,
    // mark the pressure card active (without inventing event text).
    if (!parsedMemory) {
      maybeAutoCompleteOnscreenSeed(original);
    }

    // THOUGHT CARD capture: ONLY when a thought was asked this turn (Thought system).
    // Captures the leading parenthetical and strips it from visible text. Independent of Life Cards.
    const visibleText = captureThought(original);

    syncCards();
    updateDebugCard();
    const cleaned = stripBlocks(visibleText);
    return cleaned || visibleText || " ";
  }

  function handleContext(rawText) {
    const cg = ensureState();
    cg.turn = (cg.turn || 0) + 1;
    cg.sceneActors = sceneActors(rawText); // who is in the current scene this turn
    syncCards();
    const directive = buildContextDirective(rawText);
    const active = buildActiveThreadsBlock();
    advanceThreadDormancy(); // dormancy progression only; injects nothing
    syncCards();
    // Thought system (independent of Life Cards): age the 💭 marker, then decide +
    // inject the thought ASK.
    expireThoughtMarker();
    const thoughtAsk = buildThoughtAsk(rawText);
    updateDebugCard();
    // Order matches the released build: the ACTIVE LIFE THREADS block is LAST so it is the
    // most salient thing the model reads (this is what makes Dynamic Large use the cards).
    // The thought ASK goes BEFORE it -- it only governs how the reply STARTS, so it does
    // not need to be last, and keeping it last was displacing the Life Cards.
    return String(rawText || "").trimEnd() + directive + thoughtAsk + active;
  }

  function handleInput(rawText) {
    ensureState();
    return stripBlocks(rawText);
  }

  // Load the editable config card into a runtime object the whole engine reads.
  // Safe defaults are used if the card is missing or unreadable.
  let LC = {
    protagonist: "",
    characters: [],
    rosterSource: "none",
    pressures: CFG.DEFAULT_PRESSURES.slice(),
    activityOff: false,
    activityTurns: CFG.DEFAULT_ACTIVITY_TURNS,
    legacyActivityUsed: false,
    targetCooldown: CFG.DEFAULT_TARGET_COOLDOWN,
    maxActive: CFG.MAX_ACTIVE_LIFE_CARDS,
    sceneRelevanceMode: CFG.SCENE_RELEVANCE_MODE,
    triggerOnTarget: CFG.TRIGGER_ON_TARGET,
    forceActiveCardTrigger: CFG.FORCE_ACTIVE_CARD_TRIGGER,
    protagonistAlwaysPresent: CFG.PROTAGONIST_ALWAYS_PRESENT,
    protagonistInvolvement: CFG.PROTAGONIST_INVOLVEMENT,
    checkpointEvery: CFG.CHECKPOINT_EVERY,
    threadReminderEvery: CFG.THREAD_REMINDER_EVERY
  };
  try { LC = buildRuntimeConfig(); } catch (e) {}

  const text = getGlobalText("");
  let result = text;
  try {
    if (hook === "context") result = handleContext(text);
    else if (hook === "output") result = handleOutput(text);
    else if (hook === "input") result = handleInput(text);
    else result = text;
  } catch (e) {
    result = text || " ";
  }
  setGlobalText(result);
  return result;
}

// Backward-compatibility alias. Existing adventures whose Context/Output/Input
// modifier tabs call ChaosGoblinV2(...) keep working without any edits.
function ChaosGoblinV2(hook, hookText) {
  return LivingCharacters(hook, hookText);
}
