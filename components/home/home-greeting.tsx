"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function getGreeting(hour: number): string {
  if (hour < 5)  return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export default function HomeGreeting() {
  const { user, isLoaded } = useUser();
  const [hour, setHour] = useState(new Date().getHours());
  
  useEffect(() => {
    setHour(new Date().getHours());
  }, []);
  
  const text = getGreeting(hour);
  const name = isLoaded && user ? (user.firstName ?? user.username ?? null) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="px-4 md:px-8 pt-3 md:pt-4 pb-1"
    >
      <h1 className="text-xl md:text-3xl font-bold tracking-tight">
        {text}
        {name && (
          <span className="gradient-text ml-2">{name}</span>
        )}
      </h1>
      <p className="text-xs md:text-sm text-[var(--muted)] mt-0.5 md:mt-1">
        Discover today's freshest Zambian hits
      </p>
    </motion.div>
  );
}
