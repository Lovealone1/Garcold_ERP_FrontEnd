"use client";

import { useCallback, useState } from "react";
import { setUserRoleBySub } from "@/services/user.api";
import { SetUserRoleIn } from "@/types/user";

type State = { loading: boolean; error: unknown; done: boolean };

export function useSetUserRoleBySub() {
  const [state, setState] = useState<State>({ loading: false, error: null, done: false });

  const mutate = useCallback(
    async (
      sub: string,
      role_id: number,
      opts?: { onSuccess?: () => void; onError?: (e: unknown) => void }
    ) => {
      setState({ loading: true, error: null, done: false });
      try {
        const body: SetUserRoleIn = { role_id };
        await setUserRoleBySub(sub, body);
        setState({ loading: false, error: null, done: true });
        opts?.onSuccess?.();
      } catch (e) {
        setState({ loading: false, error: e, done: false });
        opts?.onError?.(e);
        throw e;
      }
    },
    []
  );

  const reset = () => setState({ loading: false, error: null, done: false });

  return { ...state, mutate, reset };
}
