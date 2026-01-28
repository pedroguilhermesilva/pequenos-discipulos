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

    # 1. Check Step 2 -> Step 3 transition
    print("Checking Step 2 to Step 3 transition...")
    await page.goto(f"{base_url}/onboarding/step-2")
    await page.wait_for_selector("text=Continuar")
    await page.click("text=Continuar")
    await asyncio.sleep(2) # Wait for navigation
    print(f"URL after Step 2: {page.url}")
    if "/onboarding/step-3" in page.url:
        print("SUCCESS: Redirected to Step 3")
    else:
        print(f"FAILURE: Redirected to {page.url}")
    await page.screenshot(path="screenshot_step3_verify_v2.png")

    # 2. Check Step 3 -> Story transition
    print("Checking Step 3 to Story transition...")
    # Use more specific selector for the finish button
    await page.wait_for_selector("text=Finalizar e Explorar")
    await page.click("text=Finalizar e Explorar")
    await asyncio.sleep(2) # Wait for navigation
    print(f"URL after Step 3: {page.url}")
    if "/stories/" in page.url:
        print("SUCCESS: Redirected to Story Viewer")
    else:
        print(f"FAILURE: Redirected to {page.url}")
    await page.screenshot(path="screenshot_story_verify_v2.png")

    await browser.close()
    await async_playwright_manager.__aexit__()

if __name__ == "__main__":
    asyncio.run(run())
