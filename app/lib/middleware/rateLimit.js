/**
 * FacilityH2O — Rate Limiting Middleware
 * Author: Antoine W. Riley Sr.
 * © 2026 FacilityH2O Inc. All Rights Reserved.
 * 
 * Prevents brute force attacks, API abuse, and DoS.
 * Different limits per endpoint type.
 */

const rateLimitStore = new Map();
const CLEANUP_INTERVAL = 60000; // Clean old entries every 60 seconds

// Cleanup old entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entries] of rateLimitStore.entries()) {
    const filtered = entries.filter(time => now - time < 3600000); // Keep 1 hour
    if (filtered.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, filtered);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Rate limit configuration by endpoint type
 */
const LIMITS = {
  auth: {
    requests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    requests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  upload: {
    requests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  general: {
    requests: 200,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Check if request exceeds rate limit
 * Returns { allowed: boolean, remaining: number, retryAfter: number }
 */
export function checkRateLimit(ip, limitType = 'general') {
  const config = LIMITS[limitType] || LIMITS.general;
  const key = `${ip}:${limitType}`;
  const now = Date.now();
  
  let entries = rateLimitStore.get(key) || [];
  
  // Remove old entries outside the window
  entries = entries.filter(time => now - time < config.windowMs);
  
  const allowed = entries.length < config.requests;
  
  if (allowed) {
    entries.push(now);
  }
  
  rateLimitStore.set(key, entries);
  
  return {
    allowed,
    remaining: Math.max(0, config.requests - entries.length),
    retryAfter: allowed ? 0 : Math.ceil((entries[0] + config.windowMs - now) / 1000),
  };
}

/**
 * Middleware for Next.js API routes
 * Usage: Add to route.js handlers
 */
export async function withRateLimit(handler, limitType = 'api') {
  return async (request, { params }) => {
    // Get client IP from headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-client-ip')
      || 'unknown';
    
    const limit = checkRateLimit(ip, limitType);
    
    // Set rate limit headers
    const responseHeaders = {
      'X-RateLimit-Limit': String(LIMITS[limitType]?.requests || 200),
      'X-RateLimit-Remaining': String(limit.remaining),
    };
    
    if (!limit.allowed) {
      responseHeaders['Retry-After'] = String(limit.retryAfter);
      
      return Response.json(
        {
          error: 'Too many requests',
          retryAfter: limit.retryAfter,
        },
        {
          status: 429,
          headers: responseHeaders,
        }
      );
    }
    
    // Call the actual handler
    const response = await handler(request, { params });
    
    // Add rate limit headers to response
    Object.entries(responseHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

/**
 * Utility for distributed rate limiting (Redis-backed)
 * Use this for multi-server deployments
 */
export async function checkRateLimitRedis(redis, ip, limitType = 'general') {
  const config = LIMITS[limitType] || LIMITS.general;
  const key = `ratelimit:${ip}:${limitType}`;
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
    }
    
    const allowed = current <= config.requests;
    
    return {
      allowed,
      remaining: Math.max(0, config.requests - current),
      retryAfter: allowed ? 0 : await redis.ttl(key),
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fail open — if Redis is down, don't block requests
    return {
      allowed: true,
      remaining: config.requests,
      retryAfter: 0,
    };
  }
}

