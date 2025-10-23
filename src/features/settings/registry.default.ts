import type { SettingsRegistryItem } from "./buildSettingsNav";

export const defaultSettingsRegistry: SettingsRegistryItem[] = [
  // Grupo: Personal
  { group: "Personal", groupOrder: 1, order: 1, name: "Perfil", href: "/settings/perfil", iconName: "person", iconSet: "rounded" },

  // Grupo: Empresa
  { group: "Empresa", groupOrder: 2, order: 1, name: "Datos de la empresa", href: "/settings/compania", iconName: "apartment", iconSet: "rounded"},
  { group: "Empresa", groupOrder: 2, order: 2, name: "Gestión de usuarios", href: "/settings/usuarios", iconName: "groups", iconSet: "rounded"}
];
