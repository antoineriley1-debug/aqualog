/**
 * FacilityH2O — Feature Flag & Premium Feature Unlock System
 * Manages access to premium features based on subscription tier
 */

// Feature definitions
export const FEATURES = {
  // Core features (all tiers)
  WATER_ENTRY: 'water_entry',
  HISTORY: 'history',
  BASIC_ALERTS: 'basic_alerts',
  
  // Professional+ features
  ST108_COMPLIANCE: 'st108_compliance',
  ST108_AUDIT: 'st108_audit',
  LEGIONELLA_TRACKING: 'legionella_tracking',
  CHAIN_OF_CUSTODY: 'chain_of_custody',
  TREND_ANALYSIS: 'trend_analysis',
  
  // Premium reporting (Professional+)
  PDF_REPORTS: 'pdf_reports',
  DOH_REPORTS: 'doh_reports',
  JOINT_COMMISSION_REPORTS: 'jc_reports',
  COMPLIANCE_EXPORT: 'compliance_export',
  
  // Enterprise+ features
  MULTI_HOSPITAL: 'multi_hospital',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  API_ACCESS: 'api_access',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  AUDIT_LOG: 'audit_log',
  ADVANCED_ALERTS: 'advanced_alerts',
};

// Tier definitions with included features
export const TIER_FEATURES = {
  starter: {
    name: 'Starter',
    price: 349,
    hospitalLimit: 1,
    features: [
      FEATURES.WATER_ENTRY,
      FEATURES.HISTORY,
      FEATURES.BASIC_ALERTS,
    ],
  },
  professional: {
    name: 'Professional',
    price: 599,
    hospitalLimit: 10,
    features: [
      FEATURES.WATER_ENTRY,
      FEATURES.HISTORY,
      FEATURES.BASIC_ALERTS,
      FEATURES.ST108_COMPLIANCE,
      FEATURES.ST108_AUDIT,
      FEATURES.LEGIONELLA_TRACKING,
      FEATURES.CHAIN_OF_CUSTODY,
      FEATURES.TREND_ANALYSIS,
      FEATURES.PDF_REPORTS,
      FEATURES.DOH_REPORTS,
      FEATURES.JOINT_COMMISSION_REPORTS,
      FEATURES.COMPLIANCE_EXPORT,
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    hospitalLimit: Infinity,
    features: [
      // All features
      FEATURES.WATER_ENTRY,
      FEATURES.HISTORY,
      FEATURES.BASIC_ALERTS,
      FEATURES.ST108_COMPLIANCE,
      FEATURES.ST108_AUDIT,
      FEATURES.LEGIONELLA_TRACKING,
      FEATURES.CHAIN_OF_CUSTODY,
      FEATURES.TREND_ANALYSIS,
      FEATURES.PDF_REPORTS,
      FEATURES.DOH_REPORTS,
      FEATURES.JOINT_COMMISSION_REPORTS,
      FEATURES.COMPLIANCE_EXPORT,
      FEATURES.MULTI_HOSPITAL,
      FEATURES.ADVANCED_ANALYTICS,
      FEATURES.API_ACCESS,
      FEATURES.CUSTOM_INTEGRATIONS,
      FEATURES.AUDIT_LOG,
      FEATURES.ADVANCED_ALERTS,
    ],
  },
};

/**
 * Check if a user has access to a feature
 * @param {Object} user - User object with 'tier' property
 * @param {string} featureKey - Feature key from FEATURES
 * @returns {boolean} - True if user can access feature
 */
export function hasFeature(user, featureKey) {
  if (!user || !user.tier) return false;
  
  const tierConfig = TIER_FEATURES[user.tier];
  if (!tierConfig) return false;
  
  return tierConfig.features.includes(featureKey);
}

/**
 * Get all features available to a tier
 * @param {string} tier - Tier name (starter, professional, enterprise)
 * @returns {Array} - Array of feature keys
 */
export function getTierFeatures(tier) {
  const tierConfig = TIER_FEATURES[tier];
  return tierConfig ? tierConfig.features : [];
}

/**
 * Check if user can access a page/route based on feature
 * @param {Object} user - User object
 * @param {string} featureKey - Feature key
 * @returns {Object} - { allowed: boolean, message: string, upgradeRequired: boolean }
 */
export function checkFeatureAccess(user, featureKey) {
  if (!user) {
    return {
      allowed: false,
      message: 'Sign in required',
      upgradeRequired: false,
    };
  }

  if (hasFeature(user, featureKey)) {
    return {
      allowed: true,
      message: 'Access granted',
      upgradeRequired: false,
    };
  }

  const currentTier = TIER_FEATURES[user.tier];
  const tierName = currentTier?.name || 'Unknown';

  // Find minimum tier that has this feature
  let minimumTier = null;
  for (const [tierKey, tierConfig] of Object.entries(TIER_FEATURES)) {
    if (tierConfig.features.includes(featureKey)) {
      minimumTier = tierConfig;
      break;
    }
  }

  return {
    allowed: false,
    message: `This feature is available on ${minimumTier?.name || 'Premium'} plans and above. Your current plan: ${tierName}`,
    upgradeRequired: true,
    requiredTier: minimumTier?.name,
  };
}

/**
 * Get hospital limit for a tier
 * @param {string} tier - Tier name
 * @returns {number} - Max hospitals allowed
 */
export function getHospitalLimit(tier) {
  const tierConfig = TIER_FEATURES[tier];
  return tierConfig?.hospitalLimit || 1;
}

/**
 * Unlock a premium feature (admin only)
 * Used to grant access to specific features without tier upgrade
 * @param {Object} user - User object with id
 * @param {string} featureKey - Feature to unlock
 * @returns {Promise<void>}
 */
export async function unlockPremiumFeature(userId, featureKey) {
  try {
    const response = await fetch('/api/admin/features/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, featureKey }),
    });
    if (!response.ok) throw new Error('Failed to unlock feature');
    return await response.json();
  } catch (err) {
    console.error('Feature unlock error:', err);
    throw err;
  }
}

/**
 * Lock a premium feature (admin only)
 * @param {string} userId - User ID
 * @param {string} featureKey - Feature to lock
 * @returns {Promise<void>}
 */
export async function lockPremiumFeature(userId, featureKey) {
  try {
    const response = await fetch('/api/admin/features/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, featureKey }),
    });
    if (!response.ok) throw new Error('Failed to lock feature');
    return await response.json();
  } catch (err) {
    console.error('Feature lock error:', err);
    throw err;
  }
}

/**
 * Get user's custom unlocked features (overrides tier)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of unlocked feature keys
 */
export async function getUserUnlockedFeatures(userId) {
  try {
    const response = await fetch(`/api/admin/features/user/${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.unlockedFeatures || [];
  } catch {
    return [];
  }
}
