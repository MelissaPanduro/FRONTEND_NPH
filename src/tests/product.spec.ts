import { test } from '@playwright/test';

test('Prueba de agregar producto desde modal', async ({ page }) => {
  const startTime = performance.now();
  const clicks: string[] = [];

  const logClick = (element: string): void => {
    clicks.push(element);
    console.log(`Clic en: ${element}`);
  };

  // 1. Ir a la URL
  await page.goto('http://localhost:4200/Modulo-Galpon/Productos', { timeout: 60000 });

  // 2. Hacer clic en el botón "Agregar Producto"
  const agregarProductoBtn = page.getByRole('button', { name: 'Agregar un nuevo producto' });
  await agregarProductoBtn.waitFor({ state: 'visible', timeout: 10000 });
  await agregarProductoBtn.click();
  logClick('Agregar Producto');

  // 3. Completar los campos del formulario en el modal
  await page.locator('input[name="type"]').fill('Harina de Maíz');
  logClick('Llenar Tipo');

  await page.locator('input[name="description"]').fill('Producto natural molido');
  logClick('Llenar Descripción');

  await page.locator('input[name="packageWeight"]').fill('10');
  logClick('Llenar Peso');

  await page.locator('input[name="stock"]').fill('50');
  logClick('Llenar Stock');

  await page.locator('select[name="typeProduct"]').selectOption('MP');
  logClick('Seleccionar Tipo de Producto');

  // 4. Clic en el botón "Guardar"
  const guardarBtn = page.locator('button[type="submit"]', { hasText: 'Guardar' });
  await guardarBtn.waitFor({ state: 'visible', timeout: 10000 });
  await guardarBtn.click();
  logClick('Guardar Producto');

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`✅ El test tardó ${duration.toFixed(2)} segundos.`);
  console.log(`✅ Total de clics realizados: ${clicks.length}`);
});
