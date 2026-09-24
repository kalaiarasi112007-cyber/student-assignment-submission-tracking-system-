/**
 * Centralized API fetch helper that automatically attaches the
 * stored JWT authentication token to outgoing requests.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('assignment_token') : null;
  const options: RequestInit = { ...init };

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Detect public authentication routes where no prior Bearer token should be sent
  const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.pathname : '');
  const isAuthPublic = urlStr.includes('/api/auth/login') ||
                       urlStr.includes('/api/auth/register') ||
                       urlStr.includes('/api/auth/reset-password') ||
                       urlStr.includes('/api/auth/verify-email') ||
                       urlStr.includes('/api/auth/resend-code');

  if (token && !headers.has('Authorization') && !isAuthPublic) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  options.headers = headers;

  return window.fetch(input, options);
}

/**
 * Safely parses a fetch Response as JSON.
 * Returns clean institutional JSON error objects rather than throwing
 * raw HTML parse errors (such as "Unexpected token '<', <html>...").
 */
export async function safeJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    // If not JSON (e.g. proxy HTML response or network gateway error), translate to user-friendly JSON
    const _rawText = await res.text().catch(() => '');

    if (res.status === 401) {
      return { success: false, message: 'Invalid email or password' } as T;
    }
    if (res.status === 403) {
      return { success: false, message: 'Access denied: You are not authorized to access this resource.' } as T;
    }
    if (res.status === 404) {
      return { success: false, message: 'Account not found.' } as T;
    }
    if (res.status === 400) {
      return { success: false, message: 'Email and password are required.' } as T;
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      return { success: false, message: 'Academic server is currently restarting. Please retry in a few seconds.' } as T;
    }
    if (res.status >= 500) {
      return { success: false, message: 'Internal server error. Please try again.' } as T;
    }
    return { success: false, message: 'Unable to connect to server. Please try again.' } as T;
  }

  try {
    const data = await res.json();
    return data as T;
  } catch (_err: any) {
    return { success: false, message: 'Unable to read response from server. Please try again.' } as T;
  }
}

/**
 * Convenience helper that executes apiFetch and parses JSON with error handling.
 */
export async function apiFetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await apiFetch(input, init);
  return safeJson<T>(res);
}
