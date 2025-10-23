import type { NavSection } from '@/types/navigation';

export const sections: NavSection[] = [
  {
    title: 'Overview',
    iconName: 'dashboard',
    iconSet: 'rounded',
    items: [
      {
        iconName: 'space_dashboard',
        iconSet: 'rounded',
        name: 'Dashboard',
        href: '/inicio',  
      },
    ],
  },
  {
    title: 'Productos',
    iconName: 'inventory',
    iconSet: 'rounded',
    items: [
      {
        iconName: 'category',
        iconSet: 'rounded',
        name: 'Panel de productos',
        href: '/productos',
      },
      {
        iconName: 'explore',
        iconSet: 'rounded',
        name: 'Exploración',
        href: '/exploracion/productos',
      }
    ],
  },
  {
    title: 'Contactos',
    iconName: 'people',
    iconSet: 'rounded',
    items: [
      {
        iconName: 'supervised_user_circle',
        iconSet: 'rounded',
        name: 'Clientes',
        href: '/contactos/clientes',
      },
      {
        iconName: 'contact_mail',
        iconSet: 'rounded',
        name: 'Proveedores',
        href: '/contactos/proveedores',
      },
    ],
  },
  {
    title: 'Comercial',
    iconName: 'price_change',
    iconSet: 'rounded',
    items: [
      {
        iconName: 'monetization_on',
        iconSet: 'rounded',
        name: 'Ventas',
        href: '/comercial/ventas',
      },
      {
        iconName: 'payments',
        iconSet: 'rounded',
        name: 'Compras',
        href: '/comercial/compras',
      },
      {
        iconName: 'currency_exchange',
        iconSet: 'rounded',
        name: 'Utilidades',
        href: '/comercial/utilidades',
      }
    ],
  },
  {
    title: 'Finanzas',
    iconName: 'savings',
    iconSet: 'rounded',
    items: [
      {
        iconName: 'money_off',
        iconSet: 'rounded',
        name: 'Gastos',
        href: '/finanzas/gastos',
      },
      {
        iconName: 'receipt_long',
        iconSet: 'rounded',
        name: 'Transacciones',
        href: '/finanzas/transacciones',
      },
      {
        iconName: 'credit_card',
        iconSet: 'rounded',
        name: 'Creditos-Inversiones',
        href: '/finanzas/creditos-inversiones',
      },
      {
        iconName: 'account_balance',
        iconSet: 'rounded',
        name: 'Bancos',
        href: '/finanzas/bancos',
      },
    ],
  },
  // {
  //   title: 'Reportes',
  //   iconName: 'summarize',
  //   iconSet: 'rounded',
  //   items: [
  //     {
  //       iconName: 'receipt_long',
  //       iconSet: 'rounded',
  //       name: 'Reporte de gastos',
  //       href: '/reporte/gastos',
  //     },
  //     {
  //       iconName: 'credit_card',
  //       iconSet: 'rounded',
  //       name: 'Reporte de ventas',
  //       href: '/reporte/ventas',
  //     },
  //     {
  //       iconName: 'area_chart',
  //       iconSet: 'rounded',
  //       name: 'Reporte de utilidades',
  //       href: '/reporte/utilidades',
  //     },
  //   ],
  // },
];

export function getNavSections(): NavSection[] {
  return sections;
}

export const navSections: NavSection[] = getNavSections();
