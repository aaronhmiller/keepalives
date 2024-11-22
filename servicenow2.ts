// servicenow.ts
import { firefox } from "npm:playwright";
import { config as dotenvConfig } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load environment variables
const env = dotenvConfig();

const SERVICENOW_URL = "https://dev282630.service-now.com";
const USERNAME = Deno.env.get("SERVICENOW_USERNAME") || env["SERVICENOW_USERNAME"];
const PASSWORD = Deno.env.get("SERVICENOW_PASSWORD") || env["SERVICENOW_PASSWORD"];

if (!USERNAME || !PASSWORD) {
  console.error("Please set SERVICENOW_USERNAME and SERVICENOW_PASSWORD in your .env file");
  Deno.exit(1);
}

async function loginToServiceNow() {
  console.log("Launching Firefox...");
  const browser = await firefox.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage', // Helps with memory issues in containerized environments
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Set a standard viewport size
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/100.0', // Set a standard user agent
    });

    const page = await context.newPage();

    // Set longer timeout for navigation
    page.setDefaultTimeout(60000); // 60 seconds
    page.setDefaultNavigationTimeout(60000);

    console.log("Navigating to ServiceNow login page...");
    await page.goto(SERVICENOW_URL, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for the login form to be ready
    await page.waitForSelector('form[action="login.do"]', { state: 'visible' });

    // More robust element waiting and filling
    console.log("Waiting for username field...");
    const userNameField = await page.waitForSelector('#user_name', {
      state: 'visible',
      timeout: 30000
    });
    await userNameField?.click();
    await page.waitForTimeout(500); // Small delay after click
    await userNameField?.fill(USERNAME);

    console.log("Waiting for password field...");
    const passwordField = await page.waitForSelector('#user_password', {
      state: 'visible',
      timeout: 30000
    });
    await passwordField?.click();
    await page.waitForTimeout(500); // Small delay after click
    await passwordField?.fill(PASSWORD);

    console.log("Clicking login button...");
    const loginButton = await page.waitForSelector('#sysverb_login', {
      state: 'visible',
      timeout: 30000
    });
    await loginButton?.click();

    // Wait for navigation and verify login success
    console.log("Waiting for navigation after login...");
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }),
      page.waitForSelector('div.navpage-header', { timeout: 60000 }) // Common ServiceNow header element
    ]);

    // Optional: Verify login success
    const isLoggedIn = await page.waitForSelector('div.navpage-header', { 
      state: 'visible',
      timeout: 30000 
    }).then(() => true).catch(() => false);

    if (isLoggedIn) {
      console.log("Login successful!");
      
      // Optional: Take a screenshot of the logged-in page
      await page.screenshot({ path: 'login-success.png' });
    } else {
      console.log("Login might have failed - couldn't verify success element");
      await page.screenshot({ path: 'login-failure.png' });
    }

    // Keep the browser open briefly to ensure everything loaded
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error("An error occurred:", error);
    
    // Take screenshot on error
    try {
      const page = await browser.contexts()[0].pages()[0];
      await page.screenshot({ path: 'error-state.png' });
    } catch (screenshotError) {
      console.error("Couldn't take error screenshot:", screenshotError);
    }
  } finally {
    await browser.close();
  }
}

// Run the script
if (import.meta.main) {
  loginToServiceNow();
}