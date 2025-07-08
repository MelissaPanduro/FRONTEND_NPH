import { Routes } from '@angular/router';

export const routes: Routes = [
  // Rutas de logeo y registracion (raíz)
  {
    path: '',
    redirectTo: 'Login',
    pathMatch: 'full'
  },
  {
    path: 'Login',
    title: 'Logueate',
    loadComponent: () => 
      import('./auth/profile/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: 'Register',
    title: 'Registrate',
    loadComponent: () =>
      import('./auth/profile/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },

  // Dashboard General
  {
    path: 'Dashboard',
    title: 'Dashboard General',
    loadComponent: () =>
      import('./components/pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  
  // Módulo Galpón
  {
    path: 'Modulo-Galpon',
    loadComponent: () =>
      import('./components/components.component').then(
        (m) => m.ComponentsComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'Dashboard',
        pathMatch: 'full',
      },
      {
        path: 'Dashboard',
        title: 'Dashboard Galpón',
        loadComponent: () =>
          import('./components/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'Masters',
        title: 'Maestros Galpón',
        loadComponent: () =>
          import(
            './components/pages/main/food/food.component'
          ).then((m) => m.FoodComponent),
      },
      {
        path: 'Alimento',
        title: 'Maestros Food',
        loadComponent: () =>
          import(
            './components/pages/main/food/food.component'
          ).then((m) => m.FoodComponent),
      },
      {
        path: 'Vacunas',
        title: 'Maestro Vacuna',
        loadComponent: () =>
          import('./components/pages/main/vaccine/vaccine.component').then(
            (m) => m.VaccineComponent
          ),
      },
      {
        path: 'Proveedor',
        title: 'Maestros Proveedor',
        loadComponent: () =>
          import(
            './components/pages/main/proveedor/proveedor.component'
          ).then((m) => m.ProveedorComponent),
      },
      {
        path: 'Ubicaciones',
        title: 'Ubicaciones',
        loadComponent: () =>
          import('./components/pages/main/location/location.component').then(
            (m) => m.LocationComponent
          ),
      },
      {
        path: 'Tipo-Proveedores',
        title: 'Tipo de Proveedores',
        loadComponent: () =>
          import(
            './components/pages/main/type-supplier/type-supplier.component'
          ).then((m) => m.TypeSupplierComponent),
      },
      {
        path: 'Galpon',
        title: 'Galpón',
        loadComponent: () =>
          import('./components/pages/main/shed/shed.component').then(
            (m) => m.ShedComponent
          ),
      },
      {
        path: 'Productos',
        title: 'Productos',
        loadComponent: () =>
          import('./components/pages/main/product/product.component').then(
            (m) => m.ProductComponent
          ),
      },
      
      {
        path: 'Gallinas',
        title: 'Gallinas',
        loadComponent: () =>
          import('./components/pages/main/hen/hen.component').then(
            (m) => m.HenComponent
          ),
      },
      {
        path: 'Producción de huevos',
        title: 'Producción de huevos',
        loadComponent: () =>
          import('./components/pages/main/egg-production/egg-production.component').then(
            (m) => m.EggProductionComponent
          ),
      },
      
      {
        path: 'Kardex',
        title: 'Kardex',
        loadComponent: () =>
          import('./components/pages/Features/kardex-egg/kardex-egg.component').then(
            (m) => m.KardexEggComponent
          ),
      },
      {
        path:'Kardex de Procesos',
        title: 'Kardex de Procesos',
        loadComponent: () =>
          import('./components/pages/Features/kardex-process/kardex-process.component').then(
            (m) => m.KardexProcessComponent
          ),
      },
      {
        path: 'Kardex Materias Primas',
        title: 'Kardex Materias Primas',
        loadComponent: () =>
          import('./components/pages/Features/kardex-primal/kardex-primal.component').then(
            (m) => m.KardexPrimalComponent
          ),
      },
      {
        path: 'Costo de alimento',
        title: 'Costo de alimento',
        loadComponent: () =>
          import('./components/pages/Features/costs-food/costs-food.component').then(
            (m) => m.CostsFoodComponent
          ),
      },
      {
        path: 'COSTO ADICIONAL',
        title: 'COSTO ADICIONAL',
        loadComponent: () =>
          import('./components/pages/Features/additional-cost/additional-cost.component').then(
            (m) => m.AdditionalCostComponent
          ),
      },
      {
        path: 'Ciclo de vida',
        title: 'Ciclo de vida',
        loadComponent: () =>
          import('./components/pages/Features/lifecycle/lifecycle.component').then(
            (m) => m.LifecycleComponent
          ),
      },
      {
        path: 'Ventas',
        title: 'Ventas',
        loadComponent: () =>
          import('./components/pages/Features/sale/sale.component').then(
            (m) => m.SaleComponent
          ),
      },
      {
        path: 'VaccineApliocations',
        title: 'Aplicacion Vacunas',
        loadComponent: () =>
          import('./components/pages/Features/vaccineAplications/vaccine-aplications.component').then(
            (m) => m.VaccineApplicationsComponent
          ),
      },
    ],
  },

  // Módulo Bienestar Común
  {
    path: 'Modulo-Bienestar-Comun',
    loadComponent: () =>
      import('./components/components.component').then(
        (m) => m.ComponentsComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'Dashboard',
        pathMatch: 'full',
      },
      {
        path: 'Dashboard',
        title: 'Dashboard Bienestar',
        loadComponent: () =>
          import('./components/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'Masters',
        title: 'Maestros Bienestar',
        loadComponent: () =>
          import('./components/pages/main/masters.component').then(
            (m) => m.MastersComponent
          ),
      },
    ],
  },

  // Módulo Psicología
  {
    path: 'Modulo-Psicologia',
    title: 'Módulo Psicología',
    loadComponent: () =>
      import('./components/components.component').then(
        (m) => m.ComponentsComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'Dashboard',
        pathMatch: 'full',
      },
      {
        path: 'Dashboard',
        title: 'Dashboard Psicología',
        loadComponent: () =>
          import('./components/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'Masters',
        title: 'Maestros Psicología',
        loadComponent: () =>
          import(
            './components/pages/main/food/food.component'
          ).then((m) => m.FoodComponent),
      },
    ],
  },

  // Ruta comodín para redireccionar a login si no se encuentra la ruta
  {
    path: '**',
    redirectTo: 'Login',
  },
];