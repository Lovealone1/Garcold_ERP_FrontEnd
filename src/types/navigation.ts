export interface NavTeam{
    name: string;
    acronym: string;
    sections: NavSection[];
}
export type MaterialIconSet = 'rounded' | 'outlined' | 'sharp';

export type RequireSpec =
  | string                           // "banks.read"
  | string[]                         // ["banks.read","banks.create"] => ALL
  | { all?: string[]; any?: string[] };

export interface NavItem {
  // Preferido: Material Symbols
  iconName?: string;
  iconSet?: MaterialIconSet;
  // Compatibilidad: SVG string (evitar en nuevo código)
  icon?: string;
  name: string;
  href: string;
  requires?: RequireSpec;
}

export interface NavSection {
  title: string;
  // Preferido: Material Symbols
  iconName?: string;
  iconSet?: MaterialIconSet;
  requires?: RequireSpec;
  icon?: string;
  items: NavItem[];
  href?: string;
}

