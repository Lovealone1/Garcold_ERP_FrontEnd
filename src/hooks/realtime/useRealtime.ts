"use client";
import { useEffect, useRef } from "react";
import { subscribeRealtime } from "@/lib/realtime/client";

type Options = {
  channel?: string;      
  log?: boolean;        
};

export function useRealtime(handler: (msg: any) => void, opts?: Options) {
  const { channel = "global", log = false } = opts || {};
  const cbRef = useRef(handler);
  cbRef.current = handler;

  useEffect(() => {
    const wrapped = (m: any) => {
      if (log) console.log("[RT] MSG", channel, m);
      cbRef.current?.(m);
    };

    if (log) console.log("[RT] SUB", channel);
    const unsubscribe = subscribeRealtime(channel, wrapped);

    return () => {
      try {
        if (log) console.log("[RT] UNSUB", channel);
        unsubscribe?.();
      } catch { }
    };

  }, [channel, log]);
}
