
import { test, expect } from '@playwright/test';

// These tests assume a local dev server running on http://localhost:8080
// And a mocked/real API for MoshlyAuth

test.describe('Moshly Redirect Logic', () => {

  test('Unauthenticated user on /dashboard redirects to /login with redirect param', async ({ page }) => {
    // Mock the session check to return null (unauthenticated)
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) });
    });

    await page.goto('http://localhost:8080/dashboard');
    
    // Wait for the redirect to happen
    await page.waitForURL(url => url.pathname === '/login' && url.searchParams.has('redirect'));
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirect')).toBe('/dashboard');
  });

  test('Authenticated user on /login redirects to /dashboard', async ({ page }) => {
    // Mock the session check to return a valid user
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'fake-jwt-token',
          user: { email: 'test@example.com', name: 'Test User' }
        }) 
      });
    });

    await page.goto('http://localhost:8080/login');
    
    // Wait for the redirect to happen
    await page.waitForURL(url => url.pathname === '/dashboard');
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/dashboard');
  });

  test('Accessing .html directly redirects to clean URL (simulated via _redirects logic)', async ({ page }) => {
    // Note: Cloudflare _redirects are usually handled by the server, 
    // but we can check if our client-side logic also handles it or if the server redirect works.
    // If running with `wrangler pages dev`, it should honor _redirects.
    
    const response = await page.goto('http://localhost:8080/dashboard.html');
    
    // Cloudflare 301 redirect
    expect(response?.status()).toBe(200); // After redirect
    expect(new URL(page.url()).pathname).toBe('/dashboard');
  });

  test('requireSession cleans .html from redirectUrl', async ({ page }) => {
    // Inject MoshlyAuth and test the logic directly in the browser
    await page.goto('http://localhost:8080/');
    
    const cleanedUrl = await page.evaluate(async () => {
      // Mock getSession to return null
      window.MoshlyAuth.getSession = async () => null;
      
      // We want to see where it WOULD redirect
      let redirectedTo = '';
      const originalLocation = window.location.href;
      
      // Override location.href to catch the redirect
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          set href(val) { redirectedTo = val; }
        },
        configurable: true
      });
      
      await window.MoshlyAuth.requireSession('/login.html');
      return redirectedTo;
    });

    expect(cleanedUrl).toContain('/login?redirect=');
    expect(cleanedUrl).not.toContain('/login.html');
  });
});
