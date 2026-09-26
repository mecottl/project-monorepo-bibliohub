import { Chart } from 'chart.js/auto';
import type { ScriptableContext } from 'chart.js';
import { token } from '@core/theme/theme.service';

// Tema de Chart.js inspirado en Tremor (tremor.so): líneas suaves sin puntos, cuadrícula tenue solo
// horizontal, sin bordes de ejes, barras redondeadas y tooltip tipo tarjeta blanca.
export const COLOR_PRIMARIO = '#9c6b43';
export const COLOR_SECUNDARIO = '#c9a67a';

// Se llama en cada render: los colores salen de los tokens del tema vigente (claro u oscuro).
export function aplicarTemaTremor(): void {
  const TINTA = token('--color-gris-oscuro');
  const CUADRICULA = token('--color-beige');
  const SUPERFICIE = token('--color-superficie');
  const TEXTO = token('--color-negro-suave');

  const fuente = getComputedStyle(document.body).getPropertyValue('--font-ui').trim();
  if (fuente) Chart.defaults.font.family = fuente;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = TINTA;
  Chart.defaults.borderColor = CUADRICULA;

  Chart.defaults.elements.line.borderWidth = 2;
  Chart.defaults.elements.line.tension = 0.35;
  Chart.defaults.elements.point.radius = 0;
  Chart.defaults.elements.point.hoverRadius = 5;
  Chart.defaults.elements.point.hoverBorderWidth = 2;
  Chart.defaults.elements.bar.borderRadius = 6;
  Chart.defaults.elements.bar.borderSkipped = false;

  Chart.defaults.interaction.mode = 'index';
  Chart.defaults.interaction.intersect = false;

  const tooltip = Chart.defaults.plugins.tooltip;
  tooltip.backgroundColor = SUPERFICIE;
  tooltip.titleColor = TEXTO;
  tooltip.bodyColor = TEXTO;
  tooltip.borderColor = CUADRICULA;
  tooltip.borderWidth = 1;
  tooltip.padding = 12;
  tooltip.cornerRadius = 10;
  tooltip.usePointStyle = true;
  tooltip.boxWidth = 8;
  tooltip.boxHeight = 8;
  tooltip.titleFont = { weight: 600 };

  Chart.defaults.plugins.legend.display = false;
}

function rgba(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

/** Relleno de área con degradado que se desvanece hacia abajo. */
export function gradienteArea(color: string) {
  return (contexto: ScriptableContext<'line'>) => {
    const { chart } = contexto;
    const area = chart.chartArea;
    if (!area) return rgba(color, 0.15);
    const gradiente = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradiente.addColorStop(0, rgba(color, 0.3));
    gradiente.addColorStop(1, rgba(color, 0));
    return gradiente;
  };
}

export const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export const monedaCorta = (valor: number): string =>
  valor >= 1000
    ? `$${(valor / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })} mil`
    : `$${valor}`;
