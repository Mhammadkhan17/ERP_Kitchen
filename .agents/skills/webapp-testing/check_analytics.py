from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: errors.append(f"[PAGE_ERROR] {err}"))

    page.goto("http://localhost:5173/analytics", timeout=15000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    page.screenshot(path="D:\\ERP\\screenshot-analytics.png", full_page=True)

    print("=== PAGE TITLE ===")
    print(page.title())

    print("\n=== VISIBLE TEXT ===")
    body = page.locator("body")
    print(body.inner_text()[:3000])

    print("\n=== CONSOLE LOGS ===")
    for e in errors:
        print(e)

    browser.close()
