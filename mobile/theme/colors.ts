export const colors = {
  // --- Updated Primary Palette to match the deep purple background and buttons ---
  primary: '#3F3588',            // Deep main purple (from button/background)
  primaryDark: '#2C255F',        // Darker purple for pressed state/accents
  primaryLight: '#CAC6E0',       // Adjusted very light purple, still related

  // --- Updated Secondary Palette to support the deep primary color ---
  secondary: '#5E54A2',          // Supporting purple/lavender, slightly lighter than primary
  secondaryDark: '#4A437C',
  secondaryLight: '#EEF0FF',     // Keeping a very light related shade

  // --- Accent and Background Colors ---
  accent: '#FF72D2',             // Pink highlight (kept as no alternative shown)

  background: '#E3E3E3',         // Pure white base (for the main screen part)
  surface: '#c7c6c6ff',            // White for the large card (Login/Create Account block)
  surfaceVariant: '#E3E3E3',     // Subtle borders/outlines (kept, not explicitly visible but needed)

  // --- Text and Utility Colors ---
  text: '#3b3a3aff',               // Primary text on the dark background
  textSecondary: '#4B4D5D',      // For secondary text on light backgrounds (assumed for future screens)
  textMuted: '#8A8CA2',          // Muted text (assumed)

  error: '#E05151',
  success: '#2ECC71',
  warning: '#F5A623',

  border: '#D7D9E7',             // Soft border (assumed)

  // --- Gradient (Updated to reflect the deep primary color) ---
  gradient: {
    primary: ['#3F3588', '#5E54A2'], // Primary deep to secondary support
    secondary: ['#5E54A2', '#3F3588'],
    soft: ['#F4F5FF', '#FFFFFF'],
  },
};