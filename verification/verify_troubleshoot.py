from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 720})
    page = context.new_page()

    # Go to home page
    print("Navigating to home page...")
    page.goto("http://localhost:3000")

    # Wait for hydration/load
    page.wait_for_load_state("networkidle")

    # Check for "No Connection?" link in desktop navbar
    print("Checking for navbar link...")
    # Using get_by_role link with name. Note: text might be uppercase in UI due to CSS?
    # The code says: className="... uppercase ..." so the text content is "No Connection?" but rendered uppercase.
    # Playwright name matching is usually case-insensitive or matches text content.
    link = page.locator("nav").get_by_role("link", name="No Connection?")
    expect(link).to_be_visible()

    # Click the link
    print("Clicking link...")
    link.click()

    # Wait a bit for scroll
    page.wait_for_timeout(1000)

    # Check if section exists
    print("Checking section content...")
    section_header = page.get_by_role("heading", name="No Connection?", exact=True)
    expect(section_header).to_be_visible()

    # Verify some content (Taglish)
    expect(page.get_by_text("Restart Modem")).to_be_visible()
    expect(page.get_by_text("Hugutin ang power adapter")).to_be_visible()
    expect(page.get_by_text("Check Cables")).to_be_visible()
    expect(page.get_by_text("Siguraduhin na mahigpit ang yellow patch cord")).to_be_visible()

    # Take screenshot of the section specifically or full page
    print("Taking screenshot...")
    page.screenshot(path="verification/troubleshoot_page.png", full_page=True)

    browser.close()
    print("Done.")

with sync_playwright() as playwright:
    run(playwright)
