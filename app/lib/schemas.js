/**
 * FacilityH2O — Input Validation Schemas (Zod)
 * Author: Antoine W. Riley Sr.
 * © 2026 FacilityH2O Inc. All Rights Reserved.
 * 
 * Validates all user input before processing.
 * Used in all API routes to prevent injection attacks & malformed data.
 */

import { z } from 'zod';

// ════════════════════════════════════════════════════════════════════════════════
// AUTH SCHEMAS
// ════════════════════════════════════════════════════════════════════════════════

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /[A-Z]/,
    'Password must contain at least one uppercase letter'
  ).regex(
    /[0-9]/,
    'Password must contain at least one number'
  ),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  org_name: z.string().min(2, 'Organization name required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  token: z.string().min(10, 'Invalid reset token'),
});

// ════════════════════════════════════════════════════════════════════════════════
// CHEMISTRY ENTRY SCHEMAS
// ════════════════════════════════════════════════════════════════════════════════

export const ChemistryReadingsSchema = z.object({
  ph: z.number().min(6.5).max(8.5, 'pH must be between 6.5 and 8.5'),
  alkalinity: z.number().min(80).max(120, 'Alkalinity must be between 80-120 ppm'),
  hardness: z.number().min(100).max(300, 'Hardness must be between 100-300 ppm'),
  chloride: z.number().min(0).max(500, 'Chloride must be between 0-500 ppm'),
  sulfite: z.number().min(0).max(1000, 'Sulfite must be between 0-1000 ppm'),
  dissolved_oxygen: z.number().min(0).max(20, 'Dissolved oxygen must be between 0-20 ppm'),
});

export const ChemistryEntrySchema = z.object({
  facility_id: z.string().uuid('Invalid facility ID'),
  system_type: z.enum(['boiler', 'chilled'], { errorMap: () => ({ message: 'System type must be boiler or chilled' }) }),
  shift: z.enum(['morning', 'evening', 'night'], { errorMap: () => ({ message: 'Invalid shift' }) }),
  entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  tester_name: z.string().min(2, 'Tester name required'),
  operator_name: z.string().min(2, 'Operator name required'),
  readings: ChemistryReadingsSchema,
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export const BackdatedChemistryEntrySchema = ChemistryEntrySchema.extend({
  missed_reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be 500 characters or less'),
  is_backdated: z.boolean().default(true),
});

// ════════════════════════════════════════════════════════════════════════════════
// LEGIONELLA ENTRY SCHEMAS
// ════════════════════════════════════════════════════════════════════════════════

export const LegionellaReadingsSchema = z.object({
  location: z.string().min(2, 'Location required'),
  temperature: z.number().min(0).max(100, 'Temperature must be between 0-100°C'),
  free_chlorine: z.number().min(0).max(10, 'Free chlorine must be between 0-10 ppm'),
  combined_chlorine: z.number().min(0).max(10, 'Combined chlorine must be between 0-10 ppm'),
});

export const LegionellaEntrySchema = z.object({
  facility_id: z.string().uuid('Invalid facility ID'),
  entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  readings: z.array(LegionellaReadingsSchema).min(1, 'At least one reading required'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

// ════════════════════════════════════════════════════════════════════════════════
// ALERT SCHEMAS
// ════════════════════════════════════════════════════════════════════════════════

export const AlertAckSchema = z.object({
  alert_id: z.string().uuid('Invalid alert ID'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

// ════════════════════════════════════════════════════════════════════════════════
// NOTIFICATION RULE SCHEMAS
// ════════════════════════════════════════════════════════════════════════════════

export const NotificationRuleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  trigger_event: z.enum(['ph_out_of_range', 'alkalinity_low', 'hardness_high', 'legionella_detected']),
  recipients: z.array(z.string().email('Invalid email address')),
  enabled: z.boolean().default(true),
});

// ════════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT SCHEMAS
// ════════════════════════════════════════════════════════════════════════════════

export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name required'),
  role: z.enum(['admin', 'operator'], { errorMap: () => ({ message: 'Invalid role' }) }),
  facilities: z.array(z.string().uuid()).optional(),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2, 'Name required').optional(),
  role: z.enum(['admin', 'operator']).optional(),
  facilities: z.array(z.string().uuid()).optional(),
  active: z.boolean().optional(),
});

// ════════════════════════════════════════════════════════════════════════════════
// HELPER: Safe Validation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validates data against schema and returns safe result or error
 * Never exposes internal validation errors to client
 */
export async function validateInput(schema, data) {
  try {
    const result = await schema.parseAsync(data);
    return { success: true, data: result };
  } catch (error) {
    // Log full error internally, return sanitized error to client
    console.error('Validation error:', error.errors);
    
    // Return only field names and generic messages
    const sanitizedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: 'Invalid input. Please check your data and try again.',
    }));
    
    return { success: false, errors: sanitizedErrors };
  }
}

