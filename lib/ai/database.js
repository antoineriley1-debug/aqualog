/**
 * AI Database Utilities
 * Handle user configuration, API key storage, and usage tracking
 * © 2026 Antoine Riley
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Get user's AI configuration
 */
export async function getAIConfig(userId) {
  try {
    const { data, error } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return null;
  }
}

/**
 * Update user's AI configuration
 */
export async function setAIConfig(userId, config) {
  try {
    const { data, error } = await supabase
      .from('ai_model_configs')
      .upsert({
        user_id: userId,
        primary_model: config.primaryModel,
        auto_fallback: config.autoFallback,
        fallback_order: config.fallbackOrder,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating AI config:', error);
    throw error;
  }
}

/**
 * Store encrypted API key
 */
export async function setAPIKey(userId, provider, encryptedKey) {
  try {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .upsert({
        user_id: userId,
        provider,
        encrypted_key: encryptedKey,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error storing API key:', error);
    throw error;
  }
}

/**
 * Get encrypted API key for a provider
 */
export async function getAPIKey(userId, provider) {
  try {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.encrypted_key || null;
  } catch (error) {
    console.error('Error fetching API key:', error);
    return null;
  }
}

/**
 * Log AI usage for tracking
 */
export async function logUsage(userId, model, taskType, tokens, cost, duration, status = 'success', errorMessage = null) {
  try {
    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      model,
      task_type: taskType,
      tokens_in: tokens.input || 0,
      tokens_out: tokens.output || 0,
      cost: cost || 0,
      duration_ms: duration || 0,
      status,
      error_message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging usage:', error);
    // Don't throw - logging should not break the application
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUsageStats(userId, startDate = null, endDate = null) {
  try {
    let query = supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString());
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;

    // Aggregate stats
    const stats = {
      total: {
        calls: data.length,
        tokens: 0,
        cost: 0,
      },
      byModel: {},
      byTask: {},
    };

    for (const log of data) {
      stats.total.tokens += (log.tokens_in || 0) + (log.tokens_out || 0);
      stats.total.cost += log.cost || 0;

      if (!stats.byModel[log.model]) {
        stats.byModel[log.model] = { calls: 0, tokens: 0, cost: 0 };
      }
      stats.byModel[log.model].calls++;
      stats.byModel[log.model].tokens += (log.tokens_in || 0) + (log.tokens_out || 0);
      stats.byModel[log.model].cost += log.cost || 0;

      if (!stats.byTask[log.task_type]) {
        stats.byTask[log.task_type] = { calls: 0, tokens: 0, cost: 0 };
      }
      stats.byTask[log.task_type].calls++;
      stats.byTask[log.task_type].tokens += (log.tokens_in || 0) + (log.tokens_out || 0);
      stats.byTask[log.task_type].cost += log.cost || 0;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return null;
  }
}

/**
 * Get current month's usage
 */
export async function getCurrentMonthUsage(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return getUsageStats(userId, startOfMonth, endOfMonth);
}

/**
 * Set monthly budget for user
 */
export async function setMonthlyBudget(userId, month, budgetAmount, alertThreshold = null) {
  try {
    const monthDate = new Date(month);
    monthDate.setDate(1);

    const { data, error } = await supabase
      .from('ai_monthly_budgets')
      .upsert({
        user_id: userId,
        month: monthDate.toISOString().split('T')[0],
        budget_amount: budgetAmount,
        alert_threshold: alertThreshold || budgetAmount * 0.8,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting budget:', error);
    throw error;
  }
}

/**
 * Get monthly budget
 */
export async function getMonthlyBudget(userId, month = null) {
  try {
    const targetMonth = month ? new Date(month) : new Date();
    targetMonth.setDate(1);
    const monthStr = targetMonth.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_monthly_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', monthStr)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
}

/**
 * Check if user is over budget
 */
export async function checkBudgetStatus(userId) {
  try {
    const budget = await getMonthlyBudget(userId);
    if (!budget) return { onBudget: true, overBudget: false };

    const usage = await getCurrentMonthUsage(userId);
    const totalCost = usage?.total.cost || 0;

    return {
      budget: budget.budget_amount,
      alertThreshold: budget.alert_threshold,
      spent: totalCost,
      remaining: budget.budget_amount - totalCost,
      overBudget: totalCost > budget.budget_amount,
      nearThreshold: totalCost > budget.alert_threshold,
    };
  } catch (error) {
    console.error('Error checking budget:', error);
    return null;
  }
}

/**
 * Store model-specific settings
 */
export async function setModelSettings(userId, model, settings) {
  try {
    const { data, error } = await supabase
      .from('ai_model_settings')
      .upsert({
        user_id: userId,
        model,
        settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting model settings:', error);
    throw error;
  }
}

/**
 * Get model-specific settings
 */
export async function getModelSettings(userId, model) {
  try {
    const { data, error } = await supabase
      .from('ai_model_settings')
      .select('settings')
      .eq('user_id', userId)
      .eq('model', model)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.settings || {};
  } catch (error) {
    console.error('Error fetching model settings:', error);
    return {};
  }
}

/**
 * Get all user's model settings
 */
export async function getAllModelSettings(userId) {
  try {
    const { data, error } = await supabase
      .from('ai_model_settings')
      .select('model, settings')
      .eq('user_id', userId);

    if (error) throw error;

    const result = {};
    for (const row of data || []) {
      result[row.model] = row.settings;
    }
    return result;
  } catch (error) {
    console.error('Error fetching model settings:', error);
    return {};
  }
}
