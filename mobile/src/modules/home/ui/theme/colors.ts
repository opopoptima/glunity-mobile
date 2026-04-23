export const colors = {
  primaryGreen: "#6DB33F",
  lightGreenBg: "#EEF6E6",
  white: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  border: "#F0F0F0",
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#F0F0F0",
  notificationDot: "#EF4444",
  shadow: "#000000",
} as const;

export type AppColors = typeof colors;
