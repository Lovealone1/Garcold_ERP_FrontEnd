import type { NavSection, RequireSpec } from "@/types/navigation";

type HasFns = { has: (c: string) => boolean };

function isAllowed(req: RequireSpec | undefined, { has }: HasFns): boolean {
    if (!req) return true;
    if (typeof req === "string") return has(req);
    if (Array.isArray(req)) return req.every(has);                 // ALL
    const allOk = (req.all ?? []).every(has);
    const anyOk = (req.any ?? []).length ? (req.any ?? []).some(has) : true;
    return allOk && anyOk;
}

export function filterNavSections(
    sections: NavSection[],
    hasFns: HasFns
): NavSection[] {
    const out: NavSection[] = [];
    for (const sec of sections) {
        if (!isAllowed(sec.requires, hasFns)) continue;
        const items = sec.items.filter(it => isAllowed(it.requires, hasFns));
        if (items.length === 0) continue;
        out.push({ ...sec, items });
    }
    return out;
}
