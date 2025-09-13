export interface NavTeam{
    name: string;
    acronym: string;
    sections: NavSection[];
}

export type MaterialIconSet = 'rounded' | 'outlined' | 'sharp';

export interface NavItem {
  // Preferido: Material Symbols
  iconName?: string;
  iconSet?: MaterialIconSet;
  // Compatibilidad: SVG string (evitar en nuevo código)
  icon?: string;
  name: string;
  href: string;
}

export interface NavSection {
  title: string;
  // Preferido: Material Symbols
  iconName?: string;
  iconSet?: MaterialIconSet;
  // Compatibilidad: SVG string (evitar en nuevo código)
  icon?: string;
  items: NavItem[];
  href?: string;
}
