"use client";
import { useEffect } from "react";
import { subscribeRealtime } from "@/lib/realtime/client";

export function useRealtime<T = unknown>(onMsg: (m: T) => void) {
  useEffect(() => subscribeRealtime((m) => onMsg(m as T)), [onMsg]);
}