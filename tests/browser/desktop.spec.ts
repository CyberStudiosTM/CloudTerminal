import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';

const cloudTerminalExe = process.env.CLOUDTERMINAL_EXE;
const palettePilotExe = process.env.PALETTEPILOT_EXE;

if (cloudTerminalExe && palettePilotExe) {
  test('opens both Windows executables and applies an exported theme across restarts', async () => {
    const profile = await mkdtemp(join(tmpdir(), 'cyberstudios-desktop-test-'));
    const open = (executablePath: string, name: string) => electron.launch({
      executablePath,
      args: [`--user-data-dir=${join(profile, name)}`],
    });
    try {
      const pilot = await open(palettePilotExe, 'editor');
      const exportPath = join(profile, 'desktop-relay.json');
      try {
        const editor = await pilot.firstWindow();
        const name = editor.getByRole('textbox', { name: 'Palette name' });
        await name.fill('Desktop Relay');
        await name.press('Enter');
        const hex = editor.getByRole('textbox', { name: 'Swatch 1 hex' });
        await hex.fill('#E6B1EE');
        await hex.press('Enter');
        await pilot.evaluate(({ dialog }, filePath) => {
          dialog.showSaveDialog = async () => ({ canceled: false, filePath });
        }, exportPath);
        await editor.getByRole('button', { name: 'Download', exact: true }).click();
        await expect(editor.getByRole('status').filter({ hasText: 'Exported desktop-relay.json.' })).toBeVisible();
        expect(Object.keys(JSON.parse(await readFile(exportPath, 'utf8'))).sort())
          .toEqual(['colors', 'id', 'name', 'roles', 'schemaVersion']);
      } finally {
        await pilot.close();
      }

      const terminal = await open(cloudTerminalExe, 'terminal');
      try {
        const page = await terminal.firstWindow();
        const chooser = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'Import palette' }).click();
        await (await chooser).setFiles(exportPath);
        await expect(page.getByRole('dialog')).toContainText('Desktop Relay');
        await expect(page.locator('#theme-preview')).toHaveCSS('--theme-accent', '#E6B1EE');
        await page.getByRole('button', { name: 'Apply theme' }).click();
        await expect(page.getByRole('log')).toContainText('Applied Desktop Relay.');
      } finally {
        await terminal.close();
      }

      const reopened = await open(cloudTerminalExe, 'terminal');
      try {
        const page = await reopened.firstWindow();
        await expect(page.locator('#theme-status')).toContainText('Desktop Relay');
        await expect(page.getByRole('region', { name: 'Simulated terminal' })).toHaveCSS('--theme-accent', '#E6B1EE');
      } finally {
        await reopened.close();
      }
    } finally {
      await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 200 });
    }
  });
}
