import { firefox, type Page, type Browser } from 'npm:playwright';

interface AsanaCredentials {
  email: string;
  password: string;
}

class AsanaLoginAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    // Add additional browser arguments for Linux headless
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ];

    this.browser = await firefox.launch({
      headless: true,
      args: browserArgs,
      firefoxUserPrefs: {
        'network.http.connection-timeout': 60000,
        'network.http.response-timeout': 60000,
      },
    });

    const context = await this.browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 800 },
      // Add user agent to avoid detection
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
    });

    this.page = await context.newPage();

    // Enable verbose logging
    this.page.on('console', msg => console.log('Browser console:', msg.text()));
    this.page.on('pageerror', err => console.error('Browser page error:', err));
  }

  async login(credentials: AsanaCredentials) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      console.log('Navigating to Asana...');
      const response = await this.page.goto('https://app.asana.com/', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      if (!response?.ok()) {
        throw new Error(`Failed to load Asana: ${response?.status()} ${response?.statusText()}`);
      }
      
      console.log('Waiting for email input...');
      const emailInput = await this.page.waitForSelector('input[type="email"].TextInput', {
        state: 'visible',
        timeout: 10000,
      });
      
      if (!emailInput) {
        throw new Error('Email input not found');
      }

      console.log('Filling email...');
      await emailInput.fill(credentials.email);
      
      console.log('Clicking continue...');
      await Promise.all([
        this.page.waitForResponse(response => response.url().includes('asana.com') && response.status() === 200),
        this.page.click('div[role="button"].LoginEmailForm-continueButton')
      ]);

      console.log('Waiting for password input...');
      const passwordInput = await this.page.waitForSelector('input[type="password"]', {
        state: 'visible',
        timeout: 10000,
      });
      
      if (!passwordInput) {
        throw new Error('Password input not found');
      }

      console.log('Filling password...');
      await passwordInput.fill(credentials.password);
      
      console.log('Clicking login...');
      await Promise.all([
        this.page.waitForResponse(response => response.url().includes('asana.com') && response.status() === 200),
        this.page.click('div[role="button"].LoginPasswordForm-loginButton')
      ]);

      console.log('Waiting for successful login...');
      console.log('Waiting for redirect after login...');
      try {
        await this.page.waitForURL(
          url => {
            const urlStr = url.toString();
            console.log('Checking URL:', urlStr);
            return urlStr.includes('app.asana.com/0/') || 
                   urlStr.includes('app.asana.com/home/') ||
                   urlStr.includes('app.asana.com/workspace');
          },
          {
            timeout: 45000,
            waitUntil: 'networkidle',
          }
        );
      } catch (e) {
        console.error('URL wait failed:', e);
        console.log('Current URL:', await this.page.url());
        throw e;
      }

      // Wait a moment for the page to stabilize
      await this.page.waitForTimeout(5000);

      // Check current URL to verify login success
      const currentUrl = this.page.url();
      console.log('Current URL after login:', currentUrl);

      if (!currentUrl.includes('app.asana.com/0/')) {
        throw new Error('Login may have failed - not on dashboard URL');
      }

      // Try multiple selectors that might indicate successful login
      try {
        await Promise.race([
          this.page.waitForSelector('.Dashboard', { timeout: 5000 }),
          this.page.waitForSelector('.Topbar', { timeout: 5000 }),
          this.page.waitForSelector('[data-test-id="sidebar"]', { timeout: 5000 }),
          this.page.waitForSelector('.NavigationBar', { timeout: 5000 }),
          this.page.waitForSelector('[data-test-id="home-page"]', { timeout: 5000 })
        ]);
      } catch (e) {
        console.log('Warning: Could not detect standard dashboard elements, but URL suggests successful login');
      }

      // Take a success screenshot for verification
      await this.page.screenshot({ 
        path: 'login-success.png',
        fullPage: true 
      });

      console.log('Successfully logged into Asana');
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // Capture screenshot on failure
      if (this.page) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await this.page.screenshot({ 
          path: `login-error-${timestamp}.png`,
          fullPage: true 
        });
        console.log('Error screenshot saved');
        
        // Log current URL
        console.log('Current URL:', await this.page.url());
        
        // Log HTML content on error
        const content = await this.page.content();
        console.log('Page content:', content.substring(0, 500) + '...');
      }
      
      throw error;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Load environment variables
const loadEnv = async () => {
  const content = await Deno.readTextFile('.env');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const [key, value] = line.trim().split('=');
    if (key && value) {
      Deno.env.set(key, value);
    }
  }
};

async function main() {
  const automation = new AsanaLoginAutomation();
  
  try {
    await loadEnv();
    
    const email = Deno.env.get('ASANA_USR');
    const password = Deno.env.get('ASANA_PWD');
    
    if (!email || !password) {
      throw new Error('Missing required environment variables ASANA_USR or ASANA_PWD');
    }
    
    await automation.init();
    await automation.login({ email, password });
    
  } catch (error) {
    console.error('Automation failed:', error);
  } finally {
    await automation.cleanup();
  }
}

if (import.meta.main) {
  main();
}