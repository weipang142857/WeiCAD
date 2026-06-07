import { test, expect, type Page } from '@playwright/test';

// Render a non-empty pixel at the canvas center => live GL context with geometry.
async function canvasRenders(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement;
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const px = new Uint8Array(4);
    gl.readPixels(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px[0] + px[1] + px[2] > 0;
  });
}

test('loads the STL demo (no-worker path) and renders a non-empty canvas', async ({ page }) => {
  await page.goto('/');
  // The STL demo exercises STLLoader directly (no OCCT worker).
  await page.getByText('bolt_m16 (STL)').click();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // InfoPanel populated => STL parsed into a SceneModel; Format cell reads STL.
  await expect(page.getByText('Triangles')).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('cell', { name: 'STL', exact: true })).toBeVisible();

  expect(await canvasRenders(page)).toBe(true);
});

test('returns to the picker and loads another demo file', async ({ page }) => {
  await page.goto('/');
  await page.getByText('bolt_m16 (STL)').click();
  await expect(page.getByRole('cell', { name: 'bolt_m16.stl' })).toBeVisible({ timeout: 30000 });

  await page.getByRole('button', { name: 'Open another' }).click();
  await expect(page.getByText('Drop a .FCStd / .STEP / .STL file')).toBeVisible();
  await expect(page.getByText('No model loaded')).toBeVisible();

  await page.getByText('lego_brick (STEP)').click();
  await expect(page.getByRole('cell', { name: 'lego_brick.step' })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('cell', { name: 'STEP', exact: true })).toBeVisible();
});

test('measures point-to-point between two surface picks', async ({ page }) => {
  await page.goto('/');
  // Dense, well-centered model so center clicks reliably hit geometry under swiftshader.
  await page.getByText('bolt_m16 (STL)').click();
  await expect(page.getByText('Triangles')).toBeVisible({ timeout: 30000 });
  expect(await canvasRenders(page)).toBe(true);

  await page.getByRole('button', { name: /Measure/ }).click();
  // Prompt appears before any pick.
  await expect(page.getByText('Click two points')).toBeVisible();

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('no canvas box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // Two distinct points near the dense center; small offsets to land on the mesh
  // yet produce a non-zero distance. mouse.click() issues a real down+up at one
  // spot (movement 0 < 5px) so it reads as a pick, not an orbit-drag.
  await page.mouse.click(cx - 12, cy - 8);
  await page.mouse.click(cx + 12, cy + 8);

  // Readout shows a measured distance.
  await expect(page.getByText(/Distance:\s*[\d.]+/)).toBeVisible({ timeout: 5000 });
});

test('switches to wireframe and takes a screenshot', async ({ page }) => {
  await page.goto('/');
  await page.getByText('lego_brick (FCStd)').click();
  await expect(page.getByText('Triangles')).toBeVisible({ timeout: 30000 });
  await page.getByLabel('display mode').selectOption('wireframe');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText('Screenshot').click(),
  ]);
  expect(download.suggestedFilename()).toBe('view.png');
});
