/**
 * Board background definitions for the background picker.
 *
 * Each background has a unique ID, display name, CSS value, and category.
 * Categories: 'solid' (flat colors), 'gradient' (linear blends), 'pattern' (mesh/radial).
 * Item count per category MUST be divisible by 3 (grid is 3 columns).
 *
 * @typedef {Object} BoardBackground
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} css - CSS background value (gradient, color, etc.)
 * @property {string} category - Category for filtering ('solid' | 'gradient' | 'pattern')
 */

/** @type {BoardBackground[]} */
const BOARD_BACKGROUNDS = [
  // ── Solid Colors (12 = 4×3) ──────────────────────────────────────
  {
    id: 'none',
    name: 'Default',
    css: '',
    category: 'solid'
  },
  // Dark solids
  {
    id: 'slate',
    name: 'Slate',
    css: '#1e293b',
    category: 'solid'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    css: '#0f172a',
    category: 'solid'
  },
  {
    id: 'navy',
    name: 'Navy',
    css: '#172554',
    category: 'solid'
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    css: '#1c1c1c',
    category: 'solid'
  },
  {
    id: 'forest',
    name: 'Forest',
    css: '#14532d',
    category: 'solid'
  },
  // Light solids
  {
    id: 'cloud',
    name: 'Cloud',
    css: '#e8ecf1',
    category: 'solid'
  },
  {
    id: 'linen',
    name: 'Linen',
    css: '#f5f0eb',
    category: 'solid'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    css: '#e8e0f0',
    category: 'solid'
  },
  {
    id: 'seafoam',
    name: 'Seafoam',
    css: '#d5ede4',
    category: 'solid'
  },
  {
    id: 'peach',
    name: 'Peach',
    css: '#fde8d8',
    category: 'solid'
  },
  {
    id: 'sky',
    name: 'Sky',
    css: '#dbeafe',
    category: 'solid'
  },

  // ── Gradients (12 = 4×3) ─────────────────────────────────────────
  // Dark gradients
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    css: 'linear-gradient(135deg, #0c1220 0%, #1a2744 50%, #0d2137 100%)',
    category: 'gradient'
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    css: 'linear-gradient(135deg, #0a0a1a 0%, #1a1034 50%, #0d0d2b 100%)',
    category: 'gradient'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    css: 'linear-gradient(135deg, #0f0c29 0%, #1a1a4e 30%, #24243e 60%, #0f3443 100%)',
    category: 'gradient'
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    css: 'linear-gradient(135deg, #0a1628 0%, #0f2b3d 30%, #0a3d3d 60%, #0d2847 100%)',
    category: 'gradient'
  },
  {
    id: 'ember',
    name: 'Ember',
    css: 'linear-gradient(135deg, #1a0a0a 0%, #2d1212 30%, #3d1a0a 60%, #2e1505 100%)',
    category: 'gradient'
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    css: 'linear-gradient(135deg, #150a05 0%, #2e1208 30%, #451a0a 60%, #2e0f05 100%)',
    category: 'gradient'
  },
  // Light gradients
  {
    id: 'morning-mist',
    name: 'Morning Mist',
    css: 'linear-gradient(135deg, #e0e7ee 0%, #d4dce6 50%, #e8ecf1 100%)',
    category: 'gradient'
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    css: 'linear-gradient(135deg, #fce4ec 0%, #e8d5f5 50%, #dbeafe 100%)',
    category: 'gradient'
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    css: 'linear-gradient(135deg, #fef3c7 0%, #fde8d8 50%, #fce4ec 100%)',
    category: 'gradient'
  },
  {
    id: 'spring-meadow',
    name: 'Spring Meadow',
    css: 'linear-gradient(135deg, #d1fae5 0%, #dbeafe 50%, #e0e7ee 100%)',
    category: 'gradient'
  },
  {
    id: 'sunset-peach',
    name: 'Sunset Peach',
    css: 'linear-gradient(135deg, #fde8d8 0%, #fce4ec 50%, #e8d5f5 100%)',
    category: 'gradient'
  },
  {
    id: 'arctic-breeze',
    name: 'Arctic Breeze',
    css: 'linear-gradient(135deg, #dbeafe 0%, #d5ede4 50%, #e0f2fe 100%)',
    category: 'gradient'
  },

  // ── Mesh / Radial Patterns (6 = 2×3) ─────────────────────────────
  // Dark mesh
  {
    id: 'nebula',
    name: 'Nebula',
    css: 'radial-gradient(ellipse at 20% 50%, #1a0a3d 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #0a2d3d 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #2d0a2d 0%, transparent 50%), #0a0a14',
    category: 'pattern'
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    css: 'radial-gradient(ellipse at 30% 70%, #0a1a2e 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #0d2844 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #071520 0%, transparent 60%), #060d14',
    category: 'pattern'
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    css: 'radial-gradient(ellipse at 25% 25%, #1a1040 0%, transparent 40%), radial-gradient(ellipse at 75% 75%, #0a2030 0%, transparent 40%), radial-gradient(ellipse at 50% 10%, #200a30 0%, transparent 35%), #080810',
    category: 'pattern'
  },
  // Light mesh
  {
    id: 'prism',
    name: 'Prism',
    css: 'radial-gradient(ellipse at 20% 40%, #dbeafe 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #e8d5f5 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #d1fae5 0%, transparent 50%), #f0f4f8',
    category: 'pattern'
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    css: 'radial-gradient(ellipse at 30% 60%, #fde8d8 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #fce4ec 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #dbeafe 0%, transparent 60%), #faf5f0',
    category: 'pattern'
  },
  {
    id: 'aurora-soft',
    name: 'Aurora Soft',
    css: 'radial-gradient(ellipse at 25% 30%, #d1fae5 0%, transparent 45%), radial-gradient(ellipse at 75% 70%, #dbeafe 0%, transparent 45%), radial-gradient(ellipse at 50% 10%, #e8d5f5 0%, transparent 40%), #eef2f6',
    category: 'pattern'
  }
];

/** Background categories with display labels */
export const BACKGROUND_CATEGORIES = [
  { id: 'solid', label: 'Colors' },
  { id: 'gradient', label: 'Gradients' },
  { id: 'pattern', label: 'Mesh' },
  { id: 'custom', label: 'Custom' }
];
/**
 * Get a background definition by ID.
 * @param {string} id
 * @returns {BoardBackground|undefined}
 */
export const getBackgroundById = (id) =>
  BOARD_BACKGROUNDS.find(bg => bg.id === id);

/**
 * Get all backgrounds in a given category.
 * @param {string} category
 * @returns {BoardBackground[]}
 */
export const getBackgroundsByCategory = (category) =>
  BOARD_BACKGROUNDS.filter(bg => bg.category === category);

export default BOARD_BACKGROUNDS;
