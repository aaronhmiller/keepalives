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
  console.log("Launching browser...");
  const browser = await firefox.launch({
    headless: false, // Set to true for production use
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to ServiceNow login page...");
    await page.goto(SERVICENOW_URL);

    // Wait for and fill in the username field
    await page.waitForSelector('#user_name');
    await page.fill('#user_name', USERNAME);

    // Wait for and fill in the password field
    await page.waitForSelector('#user_password');
    await page.fill('#user_password', PASSWORD);

    // Click the login button
    await page.click('#sysverb_login');

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    console.log("Login successful!");

    // Optional: Add a delay to keep the browser open for a few seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}

// Run the script
if (import.meta.main) {
  loginToServiceNow();
}
