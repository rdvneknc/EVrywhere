export type EVColorPalette = {
  primary: string;
  primaryLight: string;
  primaryMid: string;
  onPrimary: string;
  surface: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  border: string;
  borderFocus: string;
  divider: string;
  error: string;
  tag1Bg: string;
  tag1Text: string;
  tag2Bg: string;
  tag2Text: string;
  tag3Bg: string;
  tag3Text: string;
  acBlue: string;
  dcAmber: string;
  hpcPurple: string;
};

export const LightColors: EVColorPalette = {
  primary: '#2DC653',
  primaryLight: '#E8F9ED',
  primaryMid: '#B6EFC5',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  background: '#F6FBF7',
  textPrimary: '#0D1B12',
  textSecondary: '#5A7264',
  textHint: '#ADC4B4',
  border: '#D4EBD9',
  borderFocus: '#2DC653',
  divider: '#E8F2EA',
  error: '#D94F3D',
  tag1Bg: '#E8F9ED',
  tag1Text: '#1A8C40',
  tag2Bg: '#E8F3FC',
  tag2Text: '#185FA5',
  tag3Bg: '#FFF3E0',
  tag3Text: '#BF6D00',
  acBlue: '#378ADD',
  dcAmber: '#EF9F27',
  hpcPurple: '#7F77DD',
};

export const DarkColors: EVColorPalette = {
  primary: '#3DD968',
  primaryLight: '#143221',
  primaryMid: '#1F4A2C',
  onPrimary: '#06140B',
  surface: '#122018',
  background: '#0B1410',
  textPrimary: '#E8F5EC',
  textSecondary: '#9BB5A6',
  textHint: '#5F7A6B',
  border: '#24382C',
  borderFocus: '#3DD968',
  divider: '#1A2B21',
  error: '#F07167',
  tag1Bg: '#143221',
  tag1Text: '#7DFFA8',
  tag2Bg: '#152536',
  tag2Text: '#7EB6F0',
  tag3Bg: '#2E2416',
  tag3Text: '#F0C27A',
  acBlue: '#5BA3E8',
  dcAmber: '#F0B14A',
  hpcPurple: '#9B94E8',
};

/** Varsayılan açık tema — bileşenlerde useTheme().colors tercih et */
export const EVColors: EVColorPalette = LightColors;
