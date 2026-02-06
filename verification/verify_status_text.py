from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})

    # Go to home page
    print("Navigating to home page...")
    page.goto("http://localhost:3000")

    # Wait for load
    page.wait_for_load_state("networkidle")

    # Scroll to status section (where the search box is)
    # The status section has id="status"
    status_section = page.locator("#status")
    status_section.scroll_into_view_if_needed()

    # Verify the empty state text
    print("Verifying empty state text...")
    expect(page.get_by_text("No Active Search")).to_be_visible()

    # Verify the new text
    new_text_part = page.get_by_text("chat with our support team")
    expect(new_text_part).to_be_visible()

    # Take screenshot of the status card
    print("Taking screenshot...")
    # Locating the card container relative to the ID, or just the status section
    # The status section contains the card. Let's screenshot the section.
    status_section.screenshot(path="verification/status_empty_state.png")

    browser.close()
    print("Done.")

with sync_playwright() as playwright:
    run(playwright)
