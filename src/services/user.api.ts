
import api from "./salesApi";
import type {
    InviteUserIn,
    CreateUserIn,
    AdminUserOut,
    AdminUsersPage,
    SetUserRoleIn,
    UpdateUserIn,
    SetUserActiveIn,
    UserDTO
} from "@/types/user";

export async function listUsers(
    page = 1,
    per_page = 50,
    email?: string
): Promise<AdminUsersPage> {
    const { data } = await api.get("/admin", {
        params: { page, per_page, email: email || undefined, _ts: Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as AdminUsersPage;
}

export async function inviteUser(payload: InviteUserIn): Promise<AdminUserOut> {
    const { data } = await api.post("/admin/invite", payload);
    return data as AdminUserOut;
}

export async function createUser(payload: CreateUserIn): Promise<AdminUserOut> {
    const { data } = await api.post("/admin/create", payload);
    return data as AdminUserOut;
}

export async function deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/${encodeURIComponent(userId)}`);
}

export async function setUserRoleBySub(sub: string, body: SetUserRoleIn): Promise<void> {
    await api.patch(`/admin/users/${encodeURIComponent(sub)}/role`, body);
}

export async function updateUser(userId: string, payload: UpdateUserIn): Promise<AdminUserOut> {
    const body = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
    );
    const { data } = await api.put(`/admin/${encodeURIComponent(userId)}`, body);
    return data as AdminUserOut;
}

export async function listLocalUsers(): Promise<UserDTO[]> {
    const { data } = await api.get("/admin/users/local", {
        params: { _ts: Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as UserDTO[];
}

export async function getUserBySub(sub: string): Promise<UserDTO> {
    const { data } = await api.get(`/admin/users/${encodeURIComponent(sub)}`, {
        params: { _ts: Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as UserDTO;
}

export async function setUserActiveBySub(
    sub: string,
    body: SetUserActiveIn
): Promise<void> {
    await api.patch(`/admin/users/${encodeURIComponent(sub)}/active`, body);
}