// ── Auth stack ────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Splash:         undefined;
  Intro:          undefined;
  Welcome:        undefined;
  Login:          undefined;
  Register:       undefined;
  ForgotPassword: undefined;
  ResetPassword:  { token: string };   // ← arrives via deep link ?token=xxx
  EmailVerified:  { success: boolean }; // ← arrives via deep link ?verified=1
};

// ── App (authenticated) stack ─────────────────────────────────────────────────
export type AppStackParamList = {
  Home:        undefined;
  Map:         undefined;
  Profile:     undefined;
  Settings:    undefined;
  EditProfile: undefined;
};
