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

  // 2. Esperar y hacer clic en "Agregar Producto"
  const agregarProductoBtn = page.locator('button:has-text("Agregar Producto")');
  await agregarProductoBtn.waitFor({ state: 'visible', timeout: 10000 });
  await agregarProductoBtn.click();
  logClick('Agregar Producto');

  // 3. Completar los campos del formulario en el modal
  await page.getByLabel('Nombre Producto:').fill('Harina de Maíz');
  logClick('Llenar Nombre Producto');

  await page.getByLabel('Descripción:').fill('Producto natural molido');
  logClick('Llenar Descripción');

  await page.getByLabel('Peso paq.(kg):').fill('10');
  logClick('Llenar Peso');

  await page.getByLabel('Stock paq.:').fill('50');
  logClick('Llenar Stock');

  await page.getByLabel('Tipo de Producto:').selectOption('MP');
  logClick('Seleccionar Tipo de Producto');

  // 4. Clic en "Guardar"
  const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar")');
  await guardarBtn.waitFor({ state: 'visible', timeout: 10000 });
  await guardarBtn.click();
  logClick('Guardar Producto');

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`✅ El test tardó ${duration.toFixed(2)} segundos.`);
  console.log(`✅ Total de clics realizados: ${clicks.length}`);
});
