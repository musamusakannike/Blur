"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AutoScrollingText from "@/components/LandingPage/AutoScrollingText";
import Experience from "@/components/LandingPage/Experience";
import Hero from "@/components/LandingPage/Hero";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="bg-linear-to-b from-black via-gray-900 to-black">
      <AutoScrollingText
        sentences={[
          "Say it without your name",
          "Where honesty stays anonymous",
          "Speak freely. Stay unseen",
          "Send what you can't say out loud",
          "No judgment. No names",
          "Unfiltered thoughts, protected identity",
          "Unmask the message, not the sender",
          "Your voice. Your truth. Your privacy.",
        ]}
      />
      <Hero />
      <Experience />
    </div>
  );
}
