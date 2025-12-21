"use client";

import AutoScrollingText from "@/components/LandingPage/AutoScrollingText";
import Hero from "@/components/LandingPage/Hero";

export default function Home() {
  return (
    <div>
      <AutoScrollingText
        sentences={[
          "Say it without your name",
          "Where honesty stays anonymous",
          "Speak freely. Stay unseen",
          "Send what you can’t say out loud",
          "No judgment. No names",
          "Unfiltered",
          "Unmask the message, not the sender",
        ]}
      />
      <Hero />
    </div>
  );
}
