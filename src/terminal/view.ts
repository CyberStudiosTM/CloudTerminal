import { skyArt, type Scene } from '../animations/sky';
import { resolveRoles, type Palette } from '../themes/palette';

export function setThemeColors(element: HTMLElement, palette: Palette): void {
  for (const [role, hex] of Object.entries(resolveRoles(palette))) {
    element.style.setProperty(`--theme-${role}`, hex);
  }
}

export function renderSky(container: HTMLElement, art: HTMLElement, scene: Scene): void {
  container.hidden = scene === 'off';
  art.textContent = scene === 'off' ? '' : skyArt[scene];
}
