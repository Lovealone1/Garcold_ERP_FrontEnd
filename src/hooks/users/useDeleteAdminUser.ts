"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteUser } from "@/services/user.api";

export default function useDeleteAdminUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [deletedId, setDeletedId] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const remove = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteUser(userId);
      if (aliveRef.current) setDeletedId(userId);
      return true;
    } catch (e) {
      if (aliveRef.current) setError(e);
      return false;
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setDeletedId(null);
  }, []);

  return { remove, loading, error, deletedId, reset };
}
