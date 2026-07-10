"use client";

import { useEffect, useState } from "react";

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

type ToastMessage = { id: number; title: string; description?: string };

let toastId = 0;
const listeners: Array<(msg: ToastMessage) => void> = [];

export function toast({ title, description }: { title: string; description?: string }) {
  const id = ++toastId;
  listeners.forEach((fn) => fn({ id, title, description }));
}

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== msg.id)), 4000);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <ToastProvider>
      {messages.map((msg) => (
        <Toast key={msg.id} open>
          <div className="grid gap-1">
            <ToastTitle>{msg.title}</ToastTitle>
            {msg.description ? <ToastDescription>{msg.description}</ToastDescription> : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
