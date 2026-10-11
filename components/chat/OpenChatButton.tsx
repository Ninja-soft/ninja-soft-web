"use client";

import { openChat } from "@/lib/chat-events";

export function OpenChatButton({ className, label, children }: { className?: string; label?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={openChat} aria-label={label} className={className}>
      {children}
    </button>
  );
}
