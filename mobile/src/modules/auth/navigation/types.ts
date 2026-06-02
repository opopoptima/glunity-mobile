// ── Auth stack ────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Splash:         undefined;
  Intro:          undefined;
  Welcome:        undefined;
  Login:          undefined;
  Register:       undefined;
  ForgotPassword: { email?: string } | undefined;
  ResetPassword:  { token: string };
  EmailVerified:  { success: boolean };
};

// ── App (authenticated) stack ─────────────────────────────────────────────────
export type AppStackParamList = {
  Home:            undefined;
  Map:             undefined;
  Recipes:         undefined;
  RecipeDetail:    { recipeId?: string; initialRecipe?: any };
  Profile:         undefined;
  Settings:        undefined;
  EditProfile:     undefined;
  EditStore:       undefined;
  /** Pass sellerId + seller object when visiting another seller's profile */
  SellerProfile:   { sellerId?: string; seller?: any } | undefined;
  SellerProProfile: undefined;
  AddProduct:      { product?: any } | undefined;
  SellerStats:     undefined;
  ProductDetail:   { product: any };
};

