// Subscription limits per plan — sourced from pricing.html.
// Update here whenever pricing changes.
export const PLAN_LIMITS = {
  free:       { pdfExportsLimit: 1,   aiCreditsLimit: 100 },
  solo:       { pdfExportsLimit: 12,  aiCreditsLimit: 500 },
  collective: { pdfExportsLimit: 50,  aiCreditsLimit: 1250 },
  business:   { pdfExportsLimit: 100, aiCreditsLimit: 2500 },
  major:      { pdfExportsLimit: 250, aiCreditsLimit: 6000 },
};

// god/semi_god invite codes grant major-tier limits + role promotion on the user row.
export const GOD_TIER_PLANS = new Set(['god', 'semi_god']);

// Subscription plans valid in the subscriptions table.
export const SUBSCRIPTION_PLANS = new Set(Object.keys(PLAN_LIMITS));
