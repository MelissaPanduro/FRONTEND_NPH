import { test} from '@playwright/test';

test('Prueba simplificada de agregar alimento', async ({ page }) => {

  const startTime = performance.now();
  const clicks: string[] = [];

  const logClick = (element: string): void => {
    clicks.push(element);
    console.log(`Clic en: ${element}`);
  };

  await page.goto('http://localhost:4200/Modulo-Galpon/Alimento', { timeout: 60000 });

  const abrirModalButton = page.locator('button.bg-green-500:has-text("Agregar Alimento")');
  await abrirModalButton.waitFor({ state: 'visible', timeout: 30000 });
  await abrirModalButton.click();
  logClick('Agregar Alimento');

  await page.selectOption('#foodType', { label: 'Inicio' });
  logClick('Abrir Listado de tipo de alimento');
  logClick('Seleccionar Tipo de Alimento');
  await page.selectOption('#foodBrand', { label: 'Avifort' });
  logClick('Abrir listado de marca de alimento');
  logClick('Seleccionar Marca de Alimento');
  await page.fill('input[name="amount"]', '25');
  await page.fill('input[name="packaging"]', 'Saco');
  await page.fill('input[name="unitMeasure"]', 'Kg');

  const enviarFormularioButton = page.locator('button[type="submit"]:has-text("Agregar")');
  await enviarFormularioButton.waitFor({ state: 'visible', timeout: 30000 });
  await enviarFormularioButton.click();
  logClick('Agregar');

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`El test tardó ${duration} segundos.`);
  console.log(`Total de clics realizados: ${clicks.length}`);

});