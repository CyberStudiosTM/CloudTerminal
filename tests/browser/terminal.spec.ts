import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import type { Palette } from '../../src/themes/palette';

const starter = JSON.parse(readFileSync(new URL('../../src/themes/default.json', import.meta.url), 'utf8')) as Palette;

function command(page: Page) {
  return page.getByRole('textbox', { name: 'Command', exact: true });
}

async function run(page: Page, text: string) {
  await command(page).fill(text);
  await command(page).press('Enter');
}

test('runs the command registry and supports keyboard history and completion', async ({ page }) => {
  await page.goto('/');
  const output = page.getByRole('log');
  await command(page).fill('he');
  await command(page).press('Tab');
  await expect(command(page)).toHaveValue('help ');
  await command(page).press('Enter');
  await expect(output).toContainText('theme [list | preview <id> | apply <id>]');
  await run(page, 'about');
  await expect(output).toContainText('simulated browser terminal');
  await run(page, 'projects');
  await expect(output.getByRole('link', { name: 'GhostPort' })).toHaveAttribute('href', 'https://github.com/CyberStudiosTM/GhostPort');
  await run(page, 'byte');
  await expect(output).toContainText('Byte purrs.');
  await command(page).fill('draft');
  await command(page).press('ArrowUp');
  await expect(command(page)).toHaveValue('byte');
  await command(page).press('ArrowDown');
  await expect(command(page)).toHaveValue('draft');
  await run(page, '<img src=x onerror=alert(1)>');
  await expect(output).toContainText('<img src=x onerror=alert(1)>');
  await expect(output.locator('img')).toHaveCount(0);
  await run(page, 'clear');
  await expect(output).toBeEmpty();
});

test('uses theme commands and saves sky/motion preferences', async ({ page }) => {
  await page.goto('/');
  await run(page, 'theme list');
  await expect(page.getByRole('log')).toContainText('rose-orbit');
  await run(page, 'theme preview rose-orbit');
  await expect(page.getByRole('dialog')).toContainText('Rose Orbit');
  await page.keyboard.press('Escape');
  await expect(page.locator('#theme-status')).toContainText('CyberCore Cloud');
  await run(page, 'theme apply rose-orbit');
  await expect(page.locator('#theme-status')).toContainText('Rose Orbit');
  await run(page, 'sky stars');
  await expect(page.locator('#sky-art')).toContainText('✧');
  await page.getByLabel('Reduce motion').check();
  await expect(page.locator('#sky-art')).toHaveCSS('animation-name', 'none');
  await page.reload();
  await expect(page.locator('#sky-art')).toContainText('✧');
  await expect(page.getByLabel('Reduce motion')).toBeChecked();
  await expect(page.locator('#theme-status')).toContainText('Rose Orbit');
  await run(page, 'sky off');
  await expect(page.locator('#sky')).toBeHidden();
});

test('rejects malformed files and previews imported palettes before applying', async ({ page }) => {
  await page.goto('/');
  const chooser = page.waitForEvent('filechooser');
  await run(page, 'import');
  await (await chooser).setFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('log')).toContainText('invalid JSON');
  const custom = { ...starter, id: 'test-palette', name: 'Pastel test', colors: starter.colors.map(
    color => color.id === 'lilac' ? { ...color, hex: '#F0ABFC' } : color,
  ) };
  const file = { name: 'theme.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(custom)) };
  const fileInput = page.locator('#palette-file');
  await fileInput.setInputFiles(file);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#theme-preview')).toHaveCSS('--theme-accent', '#F0ABFC');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('#theme-status')).toContainText('CyberCore Cloud');
  await fileInput.setInputFiles(file);
  await page.getByRole('button', { name: 'Apply theme' }).click();
  await page.reload();
  await expect(page.locator('#theme-status')).toContainText('Pastel test');
  await expect(page.getByRole('region', { name: 'Simulated terminal' })).toHaveCSS('--theme-accent', '#F0ABFC');
});

test('fits a narrow viewport and respects reduced motion with accessible default controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#sky-art')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(report.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
});

test('restores a workspace after reload and isolates session transcripts', async ({ page }) => {
  await page.goto('/');
  await run(page, 'byte pet');
  await page.getByRole('button', { name: 'New session' }).click();
  await expect(page.getByRole('log')).not.toContainText('rolls over');
  await page.getByRole('button', { name: 'Session 1', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('rolls over');
  await run(page, 'sky stars');
  await page.getByLabel('Font size').fill('20');
  await page.getByLabel('Font size').press('Tab');
  await page.getByLabel('Profile name').fill('Night desk');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await run(page, 'sky off');
  await page.reload();
  await page.getByLabel('Workspace profiles').selectOption({ label: 'Night desk' });
  await expect(page.locator('#sky-art')).toContainText('✧');
  await expect(page.getByRole('log')).toHaveCSS('font-size', '20px');
});
