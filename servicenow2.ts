// servicenow.ts
import { firefox } from "npm:playwright";
import { config as dotenvConfig } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load environment variables
const env = dotenvConfig();

const SERVICENOW_URL = "https://dev282630.service-now.com";
const USERNAME = Deno.env.get("SERVICENOW_USR") || env["SERVICENOW_USR"];
const PASSWORD = Deno.env.get("SERVICENOW_PWD") || env["SERVICENOW_PWD"];

if (!USERNAME || !PASSWORD) {
  console.error("Please set SERVICENOW_USR and SERVICENOW_PWD in your .env file");
  Deno.exit(1);
}

async function loginToServiceNow() {
  console.log("Launching Firefox...");
  const browser = await firefox.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox'
    ]
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();
    
    console.log("Navigating to ServiceNow...");
    await page.goto(SERVICENOW_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for and fill login form
    await page.fill('#user_name', USERNAME);
    await page.fill('#user_password', PASSWORD);
    await page.click('#sysverb_login');
    
    // Wait for navigation
    await page.waitForNavigation({
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log("Login successful!");

  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
if (import.meta.main) {
  loginToServiceNow();
}