"use client";

import { useEffect } from "react";

export default function UserbackProvider() {
  useEffect(() => {
    async function initUserback() {
      const Userback = (await import("@userback/widget")).default;

      // Initialize widget for anonymous visitors
      await Userback(process.env.NEXT_PUBLIC_USERBACK_KEY || "");
    }

    initUserback();
  }, []);

  return null; // We don't render anything ourselves
}
