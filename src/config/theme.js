export const colors = {
  // Primary & Secondary
  primary: '#8A9EFF', // Periwinkle Blue
  secondary: '#FF6495', // Rosy Pink

  // Neutral / Greys
  background: '#EEEFF4', // Snow Drift
  surface: '#FFFFFF', // White
  border: '#B5B9CC', // Shuttle Grey tint (40%)
  borderLight: '#D1D3DC', // Shuttle Grey tint (20%)

  // Text
  textPrimary: '#181925', // Thunder
  textSecondary: '#6C7091', // Shuttle Grey

  // Feedback Colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#98E8ED', // Tron Blue

  // Button States
  primaryHover: '#6C7091',
  secondaryHover: '#E5527A',
  disabled: '#EEEFF4',
  disabledText: '#6C709180', // Shuttle Grey 50% opacity
};

export const typography = {
  // H1 (App Title): 24px / Manrope Bold
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    fontFamily: 'Manrope-Bold',
  },
  // H2 (Section Title): 20px / Manrope Semi-Bold
  h2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    fontFamily: 'Manrope-SemiBold',
  },
  // H3 (Card Title): 18px / Manrope Semi-Bold
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: 'Manrope-SemiBold',
  },
  // Body Large: 16px / Inter Regular
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  // Body Small: 14px / Inter Regular
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  // Caption: 12px / Inter Medium
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    fontFamily: 'Inter-Medium',
  },
  // Button Text: 14px / Manrope Bold / Uppercase
  button: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    fontFamily: 'Manrope-Bold',
    textTransform: 'uppercase',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const shadows = {
  // Card shadow: 0px 2px 6px rgba(24,25,37,0.08)
  card: {
    shadowColor: '#181925',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  small: {
    shadowColor: '#181925',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#181925',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};