export const dynamic = 'force-dynamic';
/**
 * GET /api/ai/usage
 * Get AI usage statistics for current user
 * Â© 2026 Antoine Riley
 */

import { getUserFromRequest } from '@/lib/auth';
import { getCurrentMonthUsage, checkBudgetStatus } from '@/lib/ai/database';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getCurrentMonthUsage(user.id);
    const budgetStatus = await checkBudgetStatus(user.id);

    return Response.json({
      thisMonth: {
        calls: usage?.total.calls || 0,
        tokens: usage?.total.tokens || 0,
        cost: usage?.total.cost || 0,
        byModel: usage?.byModel || {},
        byTask: usage?.byTask || {},
      },
      budget: budgetStatus || {
        onBudget: true,
        overBudget: false,
      },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

