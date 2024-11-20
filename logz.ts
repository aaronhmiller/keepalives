import { firefox, type Page, type Browser } from 'npm:playwright';

interface LogzioCredentials {
  email: string;
  password: string;
}

class LogzioLoginAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    this.browser = await firefox.launch({
      headless: false,
      slowMo: 100,
    });
    
    const context = await this.browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 800 },
    });
    
    this.page = await context.newPage();
  }

  async login(credentials: LogzioCredentials) {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      // Navigate to Logz.io login page
      await this.page.goto('https://app.logz.io/');
      
      // Wait for and fill email field
      await this.page.waitForSelector('[data-logz-test-subject="email-field"] input[type="email"]', {
        state: 'visible',
        timeout: 5000,
      });
      await this.page.fill('[data-logz-test-subject="email-field"] input[type="email"]', credentials.email);

      // Wait for and fill password field
      await this.page.waitForSelector('[data-logz-test-subject="password-field"] input[type="password"]', {
        state: 'visible',
        timeout: 5000,
      });
      await this.page.fill('[data-logz-test-subject="password-field"] input[type="password"]', credentials.password);

      // Click the sign in button
      await this.page.click('[data-logz-test-subject="sign-in-button"]');

      // Wait for successful login (adjust URL pattern as needed)
      await this.page.waitForURL('https://app.logz.io/**', {
        timeout: 30000,
        waitUntil: 'networkidle',
      });

      console.log('Successfully logged into Logz.io');

    } catch (error) {
      console.error('Login failed:', error);
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
  const automation = new LogzioLoginAutomation();
  
  try {
    await loadEnv();
    
    const email = Deno.env.get('LOGZ_USR');
    const password = Deno.env.get('LOGZ_PWD');
    
    if (!email || !password) {
      throw new Error('Missing required environment variables LOGZ_USR or LOGZ_PWD');
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