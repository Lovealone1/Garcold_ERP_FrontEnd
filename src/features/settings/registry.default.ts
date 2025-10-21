import type { SettingsRegistryItem } from "./buildSettingsNav";

export const defaultSettingsRegistry: SettingsRegistryItem[] = [
  // Grupo: Personal
  { group: "Personal", groupOrder: 1, order: 1, name: "Perfil", href: "/settings/profile", iconName: "person", iconSet: "rounded" },
  { group: "Personal", groupOrder: 1, order: 2, name: "Contraseña", href: "/settings/password", iconName: "password", iconSet: "rounded" },
  { group: "Personal", groupOrder: 1, order: 3, name: "Datos", href: "/settings/data", iconName: "database", iconSet: "rounded" },

  // Grupo: Empresa
  { group: "Empresa", groupOrder: 2, order: 1, name: "Datos de la empresa", href: "/compania", iconName: "apartment", iconSet: "rounded"},
  { group: "Empresa", groupOrder: 2, order: 2, name: "Gestión de usuarios", href: "/usuarios", iconName: "groups", iconSet: "rounded"}
];
