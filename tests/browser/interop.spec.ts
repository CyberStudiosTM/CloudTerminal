import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const palettePilotUrl = process.env.PALETTEPILOT_URL;

if (palettePilotUrl) {
  test('applies a real PalettePilot download and restores it after reload', async ({ page, context }) => {
    const editor = await context.newPage();
    await editor.goto(palettePilotUrl);
    const name = editor.getByRole('textbox', { name: 'Palette name' });
    await name.fill('Pastel Relay');
    await name.press('Enter');
    const hex = editor.getByRole('textbox', { name: 'Swatch 1 hex' });
    await hex.fill('#D0AAFF');
    await hex.press('Enter');
    const download = editor.waitForEvent('download');
    await editor.getByRole('button', { name: 'Download', exact: true }).click();
    const file = await download;
    const buffer = await readFile((await file.path())!);
    const exported = JSON.parse(buffer.toString('utf8'));
    expect(Object.keys(exported).sort()).toEqual(['colors', 'id', 'name', 'roles', 'schemaVersion']);
    expect(exported.schemaVersion).toBe('1.0');

    await page.goto('/');
    await page.locator('#palette-file').setInputFiles({
      name: file.suggestedFilename(), mimeType: 'application/json', buffer,
    });
    await expect(page.getByRole('dialog')).toContainText('Pastel Relay');
    await expect(page.locator('#theme-preview')).toHaveCSS('--theme-accent', '#D0AAFF');
    await expect(page.locator('#theme-status')).toContainText('CyberCore Cloud');
    await page.getByRole('button', { name: 'Apply theme' }).click();
    await page.reload();
    await expect(page.locator('#theme-status')).toContainText('Pastel Relay');
    await expect(page.getByRole('region', { name: 'Simulated terminal' })).toHaveCSS('--theme-accent', '#D0AAFF');
  });
}
