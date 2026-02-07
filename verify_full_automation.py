from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Mock Network Requests
        print("Mocking backend...")

        # Mock Login
        def handle_login(route):
            route.fulfill(json={
                "token": "fake-token",
                "role": "admin",
                "user": {
                    "name": "Admin",
                    "role": "admin",
                    "permissions": ["manage_settings", "manage_routers", "view_router_status"]
                }
            })
        page.route("**/api/auth/login", handle_login)

        # Mock Routers List
        def handle_routers(route):
            if route.request.method == "GET":
                route.fulfill(json=[
                    {
                        "_id": "router_1",
                        "name": "Mock Router",
                        "host": "192.168.88.1",
                        "port": 8728,
                        "username": "admin",
                        "status": "Online"
                    }
                ])
            else:
                route.continue_()
        page.route("**/api/routers", handle_routers)

        # Mock Push Config endpoint
        page.route("**/api/routers/*/push-config", lambda route: route.fulfill(json={"message": "Full configuration pushed successfully!"}))

        # Mock Settings
        page.route("**/api/settings", lambda route: route.fulfill(json={"defaultRate": 500}))

        # Mock Other endpoints to prevent errors
        page.route("**/api/stats", lambda route: route.fulfill(json={"dueToday": 0, "overdue": 0, "totalCollections": 0}))
        page.route("**/api/subscribers", lambda route: route.fulfill(json=[]))
        page.route("**/api/analytics", lambda route: route.fulfill(json={"totalExpected": 0, "totalCollected": 0, "currentProfit": 0, "providerCost": 0, "groupCounts": {}}))
        page.route("**/api/mikrotik/health", lambda route: route.fulfill(json={"summary": "1/1 Online", "details": []}))
        page.route("**/api/users", lambda route: route.fulfill(json=[]))


        print("Navigating to Dashboard (/team)...")
        page.goto("http://localhost:3000/team")

        # Login
        print("Filling login form...")
        try:
             page.wait_for_selector('input[type="text"]', timeout=5000)
        except:
             print("Login form not found. Taking screenshot.")
             page.screenshot(path="/home/jules/verification/login_not_found.png")
             browser.close()
             return

        page.fill('input[type="text"]', "admin") # Username
        page.fill('input[type="password"]', "password") # Password
        page.click('button:has-text("Sign In")')

        print("Logged in, waiting for dashboard...")
        # Wait for "Admin Settings" button or "BAYADNET PRO" text
        page.wait_for_selector('text=BAYADNET PRO', timeout=5000)

        # Click Admin Settings button
        # It has title="Admin Settings"
        print("Opening Settings Modal...")
        settings_btn = page.locator('button[title="Admin Settings"]')
        settings_btn.click()

        # Wait for Modal content
        page.wait_for_selector('text=Admin Settings', timeout=5000)

        # Wait for Router Settings section
        page.wait_for_selector('text=Mikrotik Routers', timeout=5000)

        # Locate the Push Config button (cloud icon)
        push_btn = page.locator('button[title="Push Configuration"]').first

        if not push_btn.is_visible():
            print("Push Config button not found!")
            page.screenshot(path="/home/jules/verification/error_no_button.png")
            browser.close()
            return

        print("Found Push Config button. Setting up dialog handler...")

        # Setup dialog handler
        dialog_messages = []
        def handle_dialog(dialog):
            print(f"Dialog message: {dialog.message}")
            dialog_messages.append(dialog.message)
            dialog.accept("bojex.online") # Accept everything (prompt input or confirm ok)

        page.on("dialog", handle_dialog)

        # Click the button
        print("Clicking Push Config button...")
        push_btn.click()

        # Wait for dialogs to be handled
        page.wait_for_timeout(3000)

        # Verification
        # We expect 2 dialogs: 1 prompt for IP, 1 confirm for action details
        # And potentially an alert for success

        has_prompt = any("Enter Server Address" in m for m in dialog_messages)
        has_confirm = any("This will apply the following settings" in m for m in dialog_messages)

        if has_prompt and has_confirm:
             print("SUCCESS: Both prompt and confirmation dialogs appeared.")
        else:
             print(f"FAILURE: Dialogs missing. Got: {dialog_messages}")

        # Take screenshot
        page.screenshot(path="/home/jules/verification/full_automation_verified.png")
        print("Screenshot saved to /home/jules/verification/full_automation_verified.png")

        browser.close()

if __name__ == "__main__":
    run()
