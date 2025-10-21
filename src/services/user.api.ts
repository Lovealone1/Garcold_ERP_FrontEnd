
import api from "./salesApi";
import type {
    InviteUserIn,
    CreateUserIn,
    AdminUserOut,
    AdminUsersPage,
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