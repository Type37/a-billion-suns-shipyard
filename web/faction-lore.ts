// Each faction carries its slogan (the epigraph that heads its rulebook entry,
// verbatim) and one original sentence summarising aesthetic and mechanical
// hook. Kept out of src/ so the rules engine stays flavour-free.

export interface FactionLore {
  tagline?: string;
  summary: string;
}

export const FACTION_LORE: Record<string, FactionLore> = {
  "heavy-industries": {
    tagline: "We use penal labour because mining is really dangerous.",
    summary:
      "Slow industrial leviathans that are nearly impossible to dislodge from objectives — position carefully and build defence in depth.",
  },
  megamart: {
    tagline: "If you can imagine it, we can deliver it (before you reconsider it).",
    summary:
      "Fragile freighter fleets that outmanoeuvre rather than outgun — high speed and movement tricks put you exactly where the enemy doesn't want you.",
  },
  "news-inc": {
    tagline: "Tonight, on This Is Your Galaxy...",
    summary:
      "Media manipulators who drain enemy command resources and disable their tools — stay close and keep the pressure on.",
  },
  "galactic-credit": {
    tagline: "We succeed when you succeed. Take out a Galactic Credit loan today.",
    summary:
      "A small, expensive fleet that bends the rules with the galaxy's most powerful (and devious) personnel.",
  },
  "the-unity": {
    tagline: "In Unity, there is strength. Join the Peacekeepers today and keep the galaxy great!",
    summary:
      "Massive capital ships backed by endless starfighter wings — field enough squadrons to fully exploit your numbers.",
  },
  "the-ordinate": {
    tagline: "Your actions have been anticipated by the Registrar. Our victory is pre-ordained.",
    summary:
      "Close-range passive fire specialists who punish enemies for moving — plan ahead, as your power depends on catching the enemy in your arc.",
  },
  "the-discord": {
    tagline: "To ignore advice. To be wasteful. To err. This is our right. And we will die for it.",
    summary:
      "Elite guerrillas with powerful squadrons and strong control tools — strike fast and hard where the enemy is weakest.",
  },
  "golem-mega-systems": {
    tagline: "> Construction fleet delta 8 approaching target. Initialising drone swarms.",
    summary:
      "A drone swarm that evolves mid-battle: ships lost spawn more drones, and your HVP choice shapes the whole character of your machine-mind.",
  },
  vyke: {
    tagline: "There is no negotiation with the Vyke. We would destroy them utterly, or be annihilated.",
    summary:
      "Aggressive alien brawlers who shut down enemy passive fire at close range — the harder you press, the less the enemy can shoot back.",
  },
  aegis: {
    tagline: "> Situational analysis... Updating capability matrix... Sorting by threat index... Acquiring targets...",
    summary:
      "An elite AI fleet that shares combat protocols between units — concentrate into an overwhelming hammer or split into mixed task forces.",
  },
  "gen-omega": {
    tagline: "Our vile offspring are our end. There's nothing on the other side of this war. Not for the last generation.",
    summary:
      "Suicidal guerrillas who hit harder as they take damage — strike from the void, fight dirty, and make every casualty count.",
  },
  alliance: {
    tagline: "Your Unity is built on forced labour, stolen lives and broken worlds. It is brittle, and we will smash it.",
    summary:
      "A powerful but fractious coalition of alien species — field many ships and exploit the chaos when common cause is found.",
  },
};
