import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async_playwright_manager = async_playwright()
    playwright = await async_playwright_manager.start()
    browser = await playwright.chromium.launch()
    page = await browser.new_page()

    # Base URL for the local dev server
    base_url = "http://localhost:3000"

    print("Checking Dev Mode bypass button on Login page...")
    await page.goto(f"{base_url}/login")

    # Wait for the dev mode button
    button_text = "Acessar em Modo de Desenvolvimento"
    await page.wait_for_selector(f"text={button_text}")

    # Click the button
    await page.click(f"text={button_text}")
    await asyncio.sleep(2) # Wait for navigation

    print(f"URL after clicking Dev Mode button: {page.url}")
    if "/onboarding/step-1" in page.url:
        print("SUCCESS: Redirected to Onboarding Step 1")
    else:
        print(f"FAILURE: Redirected to {page.url}")

    await page.screenshot(path="screenshot_dev_mode_bypass.png")

    await browser.close()
    await async_playwright_manager.__aexit__()

if __name__ == "__main__":
    asyncio.run(run())
