"use client";
import { useEffect, useState } from "react";
import { listLocalUsers } from "@/services/user.api";
import type { UserDTO } from "@/types/user";

export type LocalUsersMap = Record<string, UserDTO>;

export function useLocalUsersMap() {
  const [map, setMap] = useState<LocalUsersMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listLocalUsers();
      const m: LocalUsersMap = {};
      for (const u of rows) m[u.external_sub] = u;
      setMap(m);
    } catch (e) {
      setError(e);
      setMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);
  return { map, loading, error, reload };
}
