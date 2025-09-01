import type { SceneDef } from "./SceneEngine";

// Placeholder scenes to wire engine shape. Real visuals will replace these.
export const BaseScenes: SceneDef[] = [
  {
    key: "core-cosmos",
    position: "start",
    gate: "always",
    render: ({ userName, tone }) => (
      <div>
        <h2>🚀 Launch</h2>
        <p>Welcome{userName ? `, ${userName}` : ""}. Buckle up. Tone: {tone}.</p>
        <p>(Space scene placeholder: stars, nebulae, rocket fly-through.)</p>
      </div>
    )
  },
  {
    key: "ingredients-pan",
    position: "free",
    gate: "always",
    render: ({ tone }) => (
      <div>
        <h2>🍳 Ingredients</h2>
        <p>We’re sautéing your genres, artists, and eras. Tone: {tone}.</p>
        <p>(Pan sizzle placeholder.)</p>
      </div>
    )
  },
  {
    key: "study-verdict",
    position: "end",
    gate: "always",
    render: ({ tone }) => (
      <div>
        <h2>🧐 The Snob’s Study</h2>
        <p>Final verdict appears here. Tone: {tone}.</p>
      </div>
    )
  },
  {
    key: "rare-room",
    position: "middle",
    gate: "rareEligible",
    render: () => (
      <div>
        <h2>🔒 Rare Room</h2>
        <p>You unlocked this by having multiple well-curated playlists.</p>
      </div>
    )
  }
];