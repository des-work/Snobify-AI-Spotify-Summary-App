import { CardProps } from "./types";

function pct(n: number) { return Math.round(n * 100); }

function pickRemarks(stats: CardProps["stats"]): string[] {
  const t = stats.taste;
  const r = stats.playlistRater;
  const g = stats.topUniqueGenres?.[0]?.genre ?? "something suspicious";
  const rare = stats.rareTracks?.[0]?.name ?? null;
  const remarks: string[] = [];

  // Rarity commentary
  if (r.rarityScore > 75) {
    remarks.push("Your obscurity levels are frankly alarming. You've achieved a level of musical hipsterism that would make a Brooklyn record store clerk weep with pride.");
  } else if (r.rarityScore < 30) {
    remarks.push("You know there's more to music than the Spotify Top 50, right? I'm practically hearing the algorithm laughing.");
  } else {
    remarks.push("You hover somewhere between 'I discovered them before they were cool' and 'I found this on a curated playlist.' Respectable, if unremarkable.");
  }

  // Genre commentary
  if (r.variety > 60) {
    remarks.push(`Your top genre is ${g}, but honestly you wander so much it barely matters. A musical vagrant, if you will.`);
  } else {
    remarks.push(`You orbit ${g} with the gravitational pull of someone who knows exactly what they like — and refuses to grow.`);
  }

  // Taste commentary
  if (t.avgEnergy > 0.7 && t.avgDanceability > 0.6) {
    remarks.push("High energy AND danceable? Either you're perpetually at a party or your headphones are your only friends at one.");
  } else if (t.avgEnergy < 0.35 && t.avgValence < 0.35) {
    remarks.push("Your music is so sad and quiet, I'm concerned. Is this a cry for help or just... aesthetics?");
  }

  // Cohesion
  if (r.cohesion > 75) {
    remarks.push(`Cohesion score of ${r.cohesion} — you've built a world, not just a playlist. I'd almost call it art.`);
  } else if (r.cohesion < 30) {
    remarks.push(`Cohesion at ${r.cohesion}. Your library is less 'carefully curated' and more 'musical ADHD.' Chaotic, but never boring.`);
  }

  // Deep cut flex
  if (rare) {
    remarks.push(`Deep cut flex: "${rare}". That's a wink only the real ones catch.`);
  }

  // Overall verdict
  remarks.push(`Final score: ${r.overall}/100. Creativity ${r.creativity ?? 0}, rarity ${r.rarityScore}. Keep being weird in public.`);

  return remarks;
}

export default function SnobCard({ stats }: CardProps) {
  const remarks = pickRemarks(stats);

  return (
    <div className="card" data-card="snob">
      <div className="title">The Snob Speaks</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {remarks.map((remark, i) => (
          <div key={i} className="snob-remark" style={{ margin: 0 }}>
            {remark}
          </div>
        ))}
      </div>
      <div className="muted" style={{ textAlign: "center", marginTop: 16 }}>
        Overall: {stats.playlistRater.overall}/100 &bull;
        Rarity: {stats.playlistRater.rarityScore} &bull;
        Cohesion: {stats.playlistRater.cohesion} &bull;
        Variety: {stats.playlistRater.variety}
      </div>
    </div>
  );
}
