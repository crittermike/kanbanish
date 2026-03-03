/**
 * Board background definitions for the background picker.
 * 
 * Each background has a unique ID, display name, CSS value, category,
 * and whether it requires a Pro subscription.
 *
 * @typedef {Object} BoardBackground
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} css - CSS background value (gradient, color, or image URL)
 * @property {string} category - Category for filtering ('solid' | 'gradient' | 'pattern')
 * @property {boolean} isPro - Whether this background requires Pro
 */

/** @type {BoardBackground[]} */
const BOARD_BACKGROUNDS = [
  // ── Free: Solid Colors ──────────────────────────────────────────
  {
    id: 'none',
    name: 'Default',
    css: '',
    category: 'solid',
    isPro: false
  },
  {
    id: 'slate',
    name: 'Slate',
    css: '#1e293b',
    category: 'solid',
    isPro: false
  },
  {
    id: 'zinc',
    name: 'Zinc',
    css: '#27272a',
    category: 'solid',
    isPro: false
  },
  {
    id: 'stone',
    name: 'Stone',
    css: '#292524',
    category: 'solid',
    isPro: false
  },
  {
    id: 'midnight',
    name: 'Midnight',
    css: '#0f172a',
    category: 'solid',
    isPro: false
  },
  {
    id: 'navy',
    name: 'Navy',
    css: '#172554',
    category: 'solid',
    isPro: false
  },

  // ── Free: Gradients ─────────────────────────────────────────────
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    css: 'linear-gradient(135deg, #0c1220 0%, #1a2744 50%, #0d2137 100%)',
    category: 'gradient',
    isPro: false
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    css: 'linear-gradient(135deg, #0a0a1a 0%, #1a1034 50%, #0d0d2b 100%)',
    category: 'gradient',
    isPro: false
  },
  {
    id: 'forest-night',
    name: 'Forest Night',
    css: 'linear-gradient(135deg, #0a1510 0%, #1a2e1a 50%, #0d1f14 100%)',
    category: 'gradient',
    isPro: false
  },

  // ── Pro: Premium Gradients ──────────────────────────────────────
  {
    id: 'aurora',
    name: 'Aurora',
    css: 'linear-gradient(135deg, #0f0c29 0%, #1a1a4e 30%, #24243e 60%, #0f3443 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    css: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b3d 30%, #3d1f2e 60%, #2e1a1a 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    css: 'linear-gradient(135deg, #0a1628 0%, #0f2b3d 30%, #0a3d3d 60%, #0d2847 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'cosmic-purple',
    name: 'Cosmic Purple',
    css: 'linear-gradient(135deg, #1a0533 0%, #2d1052 40%, #1e0a3e 70%, #0f0520 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'ember',
    name: 'Ember',
    css: 'linear-gradient(135deg, #1a0a0a 0%, #2d1212 30%, #3d1a0a 60%, #2e1505 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'deep-teal',
    name: 'Deep Teal',
    css: 'linear-gradient(135deg, #0a1a1a 0%, #0d2e2e 40%, #0a2424 70%, #071a1a 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    css: 'linear-gradient(135deg, #1a0a14 0%, #2d1225 40%, #3d1a30 70%, #1a0d18 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    css: 'linear-gradient(135deg, #1a1205 0%, #2e2008 30%, #3d2a0a 60%, #1a1508 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'arctic-blue',
    name: 'Arctic Blue',
    css: 'linear-gradient(135deg, #0a1520 0%, #0f2540 40%, #0a2050 70%, #071530 100%)',
    category: 'gradient',
    isPro: true
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    css: 'linear-gradient(135deg, #150a05 0%, #2e1208 30%, #451a0a 60%, #2e0f05 100%)',
    category: 'gradient',
    isPro: true
  },

  // ── Pro: Mesh Gradients ─────────────────────────────────────────
  {
    id: 'nebula',
    name: 'Nebula',
    css: 'radial-gradient(ellipse at 20% 50%, #1a0a3d 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #0a2d3d 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #2d0a2d 0%, transparent 50%), #0a0a14',
    category: 'pattern',
    isPro: true
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    css: 'radial-gradient(ellipse at 30% 70%, #0a1a2e 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #0d2844 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #071520 0%, transparent 60%), #060d14',
    category: 'pattern',
    isPro: true
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    css: 'radial-gradient(ellipse at 25% 25%, #1a1040 0%, transparent 40%), radial-gradient(ellipse at 75% 75%, #0a2030 0%, transparent 40%), radial-gradient(ellipse at 50% 10%, #200a30 0%, transparent 35%), #080810',
    category: 'pattern',
    isPro: true
  }
];

/** Background categories with display labels */
export const BACKGROUND_CATEGORIES = [
  { id: 'solid', label: 'Colors' },
  { id: 'gradient', label: 'Gradients' },
  { id: 'pattern', label: 'Mesh' }
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

/**
 * Get all free backgrounds.
 * @returns {BoardBackground[]}
 */
export const getFreeBackgrounds = () =>
  BOARD_BACKGROUNDS.filter(bg => !bg.isPro);

/**
 * Get all pro backgrounds.
 * @returns {BoardBackground[]}
 */
export const getProBackgrounds = () =>
  BOARD_BACKGROUNDS.filter(bg => bg.isPro);

export default BOARD_BACKGROUNDS;
