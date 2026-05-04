export const TEG_CANVAS_COLORS = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
  ink: '#2B2B2B',
  inkSoft: '#2B2B2B',
  muted: '#6E6E6E',
  fog: '#E5E5E5',
  rowAlt: '#FAFBFD',
  border: '#DADDE5',
  line: '#DADDE5',
  primary: '#FB2D61',
  primaryDark: '#890E40',
  primarySoft: '#FFE8EF',
  red: '#FB2D61',
  redSoft: '#FFE8EF',
  blue: '#2E69FF',
  blueSoft: '#E8F0FF',
  success: '#29892A',
  successSoft: '#EAF6EA',
  green: '#29892A',
  greenSoft: '#EAF6EA',
  warning: '#B89116',
  warningUi: '#E8C349',
  warningSoft: '#FFF5D2',
  yellow: '#B89116',
  yellowSoft: '#FFF5D2',
  danger: '#B3261E',
  dangerSoft: '#FCE8E6',
  graySoft: '#EEF0F3',
} as const;

export const TEG_CANVAS_SHADOWS = {
  card: { x: 5, y: 6, blur: 0, color: 'rgba(0, 0, 0, 0.12)' },
  red: { x: 6, y: 7, blur: 0, color: TEG_CANVAS_COLORS.primaryDark },
} as const;

export const TEG_CANVAS_FONT = {
  heading: 'Tenon, "DM Sans", Arial, sans-serif',
  body: '"DM Sans", Arial, sans-serif',
} as const;
