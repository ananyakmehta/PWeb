// DD_initial_build.md §8.1: "Real constellations (actual star position data for
// recognizable constellations ... not generative/random scatter)."
//
// Star positions below are schematic — normalized (0-100) coordinates chosen to match
// each constellation's real, recognizable relative star arrangement (Orion's belt +
// shoulders + feet, Cassiopeia's W, the Big Dipper's bowl + handle), not
// catalog-precision RA/Dec projections. That's the right fidelity for a dimmed
// decorative background layer, and keeps every star's relative position "real" rather
// than randomly generated.
//
// Each constellation gets its own color + star count/spacing ("density") per §8.1's
// "different colors, different densities" instruction.

export interface Star {
  x: number; // 0-100, normalized within this constellation's own bounding box
  y: number; // 0-100
  r: number; // relative star size/brightness
}

export interface ConstellationDef {
  name: string;
  color: string;
  stars: Star[];
  lines: [number, number][]; // index pairs into `stars`, drawn as connecting lines
  // placement within the fixed full-viewport layer: top-left corner + box size, in vw/vh
  box: { left: number; top: number; width: number; height: number };
}

export const constellations: ConstellationDef[] = [
  {
    name: 'Orion',
    color: '#cfe3ff',
    stars: [
      { x: 65, y: 15, r: 2.4 }, // Betelgeuse
      { x: 30, y: 22, r: 2.1 }, // Bellatrix
      { x: 60, y: 52, r: 1.6 }, // Alnitak
      { x: 49, y: 56, r: 1.7 }, // Alnilam
      { x: 38, y: 60, r: 1.6 }, // Mintaka
      { x: 55, y: 96, r: 2.2 }, // Saiph
      { x: 24, y: 90, r: 2.6 }, // Rigel
    ],
    lines: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
    ],
    box: { left: 6, top: 6, width: 16, height: 30 },
  },
  {
    name: 'Cassiopeia',
    color: '#ffe9c7',
    stars: [
      { x: 0, y: 55, r: 1.8 }, // Segin
      { x: 27, y: 5, r: 1.7 }, // Ruchbah
      { x: 52, y: 45, r: 1.9 }, // Gamma Cas
      { x: 76, y: 0, r: 2.0 }, // Schedar
      { x: 100, y: 38, r: 1.6 }, // Caph
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    box: { left: 62, top: 12, width: 22, height: 10 },
  },
  {
    name: 'Big Dipper',
    color: '#d7f3ff',
    stars: [
      { x: 0, y: 62, r: 1.7 }, // Alkaid
      { x: 22, y: 45, r: 1.6 }, // Mizar
      { x: 44, y: 32, r: 1.8 }, // Alioth
      { x: 66, y: 28, r: 1.7 }, // Megrez
      { x: 64, y: 58, r: 1.6 }, // Phecda
      { x: 96, y: 66, r: 2.0 }, // Merak
      { x: 96, y: 30, r: 2.1 }, // Dubhe
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
    box: { left: 10, top: 62, width: 24, height: 16 },
  },
  // A second, dimmer/sparser pass of the same three so the layer still reads as
  // "present ... behind every block" lower on tall viewports, at lower density.
  {
    name: 'Orion (echo)',
    color: '#cfe3ff',
    stars: [
      { x: 65, y: 15, r: 1.6 },
      { x: 30, y: 22, r: 1.4 },
      { x: 60, y: 52, r: 1.1 },
      { x: 49, y: 56, r: 1.2 },
      { x: 38, y: 60, r: 1.1 },
      { x: 55, y: 96, r: 1.5 },
      { x: 24, y: 90, r: 1.8 },
    ],
    lines: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
    ],
    box: { left: 70, top: 70, width: 12, height: 24 },
  },
  {
    name: 'Big Dipper (echo)',
    color: '#d7f3ff',
    stars: [
      { x: 0, y: 62, r: 1.2 },
      { x: 22, y: 45, r: 1.1 },
      { x: 44, y: 32, r: 1.3 },
      { x: 66, y: 28, r: 1.2 },
      { x: 64, y: 58, r: 1.1 },
      { x: 96, y: 66, r: 1.4 },
      { x: 96, y: 30, r: 1.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
    box: { left: 40, top: 82, width: 18, height: 12 },
  },
];
