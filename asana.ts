import { firefox, type Page, type Browser } from 'npm:playwright';

interface AsanaCredentials {
  email: string;
  password: string;
}

class AsanaLoginAutomation {
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

  async login(credentials: AsanaCredentials) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto('https://app.asana.com/');
      
      // Wait for and fill email input
      await this.page.waitForSelector('input[type="email"].TextInput', {
        state: 'visible',
        timeout: 5000,
      });
      
      await this.page.fill('input[type="email"].TextInput', credentials.email);
      
      // Find and click the continue/next button
      await this.page.click('div[role="button"].LoginEmailForm-continueButton');

      // Wait for and fill password input
      await this.page.waitForSelector('input[type="password"]', {
        state: 'visible',
        timeout: 5000,
      });
      
      await this.page.fill('input[type="password"]', credentials.password);
      
      // Click login/submit button
      await this.page.click('div[role="button"].LoginPasswordForm-loginButton');

      // Wait for successful redirect/login
      await this.page.waitForURL('https://app.asana.com/**', {
        timeout: 30000,
        waitUntil: 'networkidle',
      });

      console.log('Successfully logged into Asana');
      
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