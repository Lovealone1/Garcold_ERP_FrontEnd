"use client";

import { useCallback, useState } from "react";
import type { AdminUserOut,UpdateUserIn } from "@/types/user";
import { updateUser } from "@/services/user.api"; 

type State = { loading: boolean; error: unknown; result: AdminUserOut | null };

export function useUpdateUser() {
  const [state, setState] = useState<State>({ loading: false, error: null, result: null });

  const mutate = useCallback(
    async (
      userId: string,
      payload: UpdateUserIn,
      opts?: { onSuccess?: (u: AdminUserOut) => void; onError?: (e: unknown) => void }
    ) => {
      setState({ loading: true, error: null, result: null });
      try {
        const res = await updateUser(userId, payload);
        setState({ loading: false, error: null, result: res });
        opts?.onSuccess?.(res);
        return res;
      } catch (e) {
        setState({ loading: false, error: e, result: null });
        opts?.onError?.(e);
        throw e;
      }
    },
    []
  );

  const reset = () => setState({ loading: false, error: null, result: null });

  return { ...state, mutate, reset };
}
