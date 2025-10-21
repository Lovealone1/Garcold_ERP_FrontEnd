import type { NavItem, NavSection } from "@/types/navigation";

export type SettingsRegistryItem = NavItem & {
    group: string;       
    order?: number;        
    groupOrder?: number;   
    require?: string | string[]; 
};

type HasPerm = (code: string) => boolean;

export function SettingsSections(
    registry: SettingsRegistryItem[],
    userPermissions: string[] = []
): NavSection[] {
    const check: HasPerm = (code) => !code || userPermissions.includes(code);

    const allow = (req?: string | string[]) => {
        if (!req) return true;
        return Array.isArray(req) ? req.every(check) : check(req);
    };

    const filtered = registry.filter((it) => allow(it.require));

    const byGroup = new Map<string, { order: number; items: SettingsRegistryItem[] }>();
    for (const it of filtered) {
        const g = byGroup.get(it.group) ?? { order: it.groupOrder ?? 0, items: [] };
        g.items.push(it);
        g.order = Math.min(g.order, it.groupOrder ?? g.order);
        byGroup.set(it.group, g);
    }

    const sections: NavSection[] = Array.from(byGroup.entries())
        .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
        .map(([title, { items }]) => ({
            title,
            items: items
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map(({ group, order, groupOrder, require, ...rest }) => rest as NavItem),
        }));

    return sections;
}
