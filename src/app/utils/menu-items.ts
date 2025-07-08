interface Route {
  title: string;
  path: string;
  icon?: string;
  children?: Route[];
}

export const MENU_ITEMS: Route[] = [
  // Dashboard General
  {
    title: 'Dashboard',
    path: '/Dashboard',
    icon: 'chart-bar',
  },

  // Módulo Galpón
  {
    title: 'Modulo Galpón',
    path: '/Modulo-Galpon',
    icon: 'warehouse',
    children: [
      {
        title: 'Principal',
        path: '/Modulo-Galpon/Masters',
        icon: 'database',
        children: [
          { title: 'Alimento', path: '/Modulo-Galpon/Alimento', icon: 'bone' },
          { title: 'Proveedor', path: '/Modulo-Galpon/Proveedor', icon: 'truck' },
          { title: 'Ubicaciones', path: '/Modulo-Galpon/Ubicaciones', icon: 'map-marker' },
          { title: 'Tipo de Proveedores', path: '/Modulo-Galpon/Tipo-Proveedores', icon: 'tags' },
          { title: 'Galpón', path: '/Modulo-Galpon/Galpon', icon: 'home' },
          { title: 'Productos', path: '/Modulo-Galpon/Productos', icon: 'box' },
          { title: 'Gallinas', path: '/Modulo-Galpon/Gallinas', icon: 'feather' },
          { title: 'Produccion Diaria', path: '/Modulo-Galpon/Producción de huevos', icon: 'egg' },
          { title: 'Maestro Vacuna', path: '/Modulo-Galpon/Vacunas', icon: 'syringe' }
        ],
      },
      {
        title: 'Funcionalidades',
        path: '/Modulo-Galpon/Transaccionales',
        icon: 'cogs',
        children: [
          { title: 'Kardex', path: '/Modulo-Galpon/Kardex', icon: 'clipboard-list' },
          { title: 'Kardex de Procesos', path: '/Modulo-Galpon/Kardex de Procesos', icon: 'clipboard-list' },
          { title: 'Kardex Materias Primas', path: '/Modulo-Galpon/Kardex Materias Primas', icon: 'clipboard-list' },
          { title: 'Costo de alimento', path: '/Modulo-Galpon/Costo de alimento', icon: 'dollar-sign' },
          { title: 'Costo Adicional', path: '/Modulo-Galpon/COSTO ADICIONAL', icon: 'money-bill' },
          { title: 'Ciclo de vida', path: '/Modulo-Galpon/Ciclo de vida', icon: 'sync' },
          { title: 'Ventas', path: '/Modulo-Galpon/Ventas', icon: 'shopping-cart' },
          { title: 'Aplicacion Vacunas', path: '/Modulo-Galpon/VaccineApliocations', icon: 'prescription-bottle-alt' },
        ],
      },
    ],
  },

  // Módulo Bienestar Común
  {
    title: 'Modulo Bienestar Común',
    path: '/Modulo-Bienestar-Comun',
    icon: 'heart',
    children: [
      { title: 'Dashboard', path: '/Modulo-Bienestar-Comun/Dashboard', icon: 'chart-line' },
      { title: 'Masters', path: '/Modulo-Bienestar-Comun/Masters', icon: 'folder' },
    ],
  },

  // Módulo Psicología
  {
    title: 'Modulo Psicología',
    path: '/Modulo-Psicologia',
    icon: 'brain',
    children: [
      { title: 'Dashboard', path: '/Modulo-Psicologia/Dashboard', icon: 'chart-pie' },
      { title: 'Masters', path: '/Modulo-Psicologia/Masters', icon: 'folder-open' },
    ],
  },

  // Opciones de perfil
  {
    title: 'Perfil',
    path: '/perfil',
    icon: 'user',
    children: [
      { title: 'Cerrar Sesión', path: '/Login', icon: 'sign-out-alt' },
    ],
  },
];