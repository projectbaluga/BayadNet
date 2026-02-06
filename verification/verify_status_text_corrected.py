from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})

    # Go to home page
    print("Navigating to home page...")
    page.goto("http://localhost:3000")

    # Wait for load
    page.wait_for_load_state("networkidle")

    # Scroll to status section
    status_section = page.locator("#status")
    status_section.scroll_into_view_if_needed()

    # Verify the updated text
    print("Verifying updated empty state text...")
    expect(page.get_by_text("No Active Search")).to_be_visible()

    # Verify the corrected text part
    # "Enter your Account ID to view your status. Once verified, you can chat with our support team."
    expect(page.get_by_text("Once verified, you can")).to_be_visible()
    expect(page.get_by_text("chat with our support team")).to_be_visible()

    # Take screenshot of the status card
    print("Taking screenshot...")
    status_section.screenshot(path="verification/status_empty_state_corrected.png")

    browser.close()
    print("Done.")

with sync_playwright() as playwright:
    run(playwright)
