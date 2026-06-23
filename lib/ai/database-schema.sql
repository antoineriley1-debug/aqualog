/**
 * AI Orchestration Layer - Database Schema
 * Add these tables to Supabase for tracking AI usage and configuration
 * © 2026 Antoine Riley
 */

-- AI Model Configuration per user
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  primary_model VARCHAR(50) DEFAULT 'claude',
  auto_fallback BOOLEAN DEFAULT true,
  fallback_order JSONB DEFAULT '["claude", "gemini", "ollama"]'::jsonb,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

-- Encrypted API Keys storage
CREATE TABLE IF NOT EXISTS ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Usage tracking and cost calculation
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  model VARCHAR(50) NOT NULL,
  task_type VARCHAR(100) NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost NUMERIC(10,6) DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT now()
);

-- Model-specific settings and preferences
CREATE TABLE IF NOT EXISTS ai_model_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  model VARCHAR(50) NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, model)
);

-- Cost tracking and budgeting
CREATE TABLE IF NOT EXISTS ai_monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  month DATE NOT NULL,
  budget_amount NUMERIC(10,2),
  alert_threshold NUMERIC(10,2),
  total_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Indexes for fast queries
CREATE INDEX idx_ai_model_configs_user ON ai_model_configs(user_id);
CREATE INDEX idx_ai_api_keys_user_provider ON ai_api_keys(user_id, provider);
CREATE INDEX idx_ai_usage_logs_user_model ON ai_usage_logs(user_id, model);
CREATE INDEX idx_ai_usage_logs_timestamp ON ai_usage_logs(timestamp);
CREATE INDEX idx_ai_model_settings_user ON ai_model_settings(user_id, model);
CREATE INDEX idx_ai_monthly_budgets_user_month ON ai_monthly_budgets(user_id, month);

-- Enable Row Level Security
ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_monthly_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Each user can only see their own data
CREATE POLICY "Users can view own model config" ON ai_model_configs
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own model config" ON ai_model_configs
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own model config" ON ai_model_configs
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view own API keys" ON ai_api_keys
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own API keys" ON ai_api_keys
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own usage logs" ON ai_usage_logs
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view own model settings" ON ai_model_settings
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own model settings" ON ai_model_settings
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own budget" ON ai_monthly_budgets
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own budget" ON ai_monthly_budgets
  FOR ALL USING (user_id = auth.uid()::text);
