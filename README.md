# 🐕‍🦺 MAD DOG CRAWLER

**Infinitely powerful for a rainy day - No internal limits**

Built at `D:\opencode-projects\mad-dog-crawler` - stored at `D:\opencode-cache\mcp\mad-dog.db` to save `C:` drive.

## Powers
- **Playwright** real browser - full JS rendering
- **Cheerio + fetch** fast for simple sites
- **PQueue** infinite concurrency (configurable 1-100)
- **SQLite** storage on `D:\` - 446MB previous cache + this DB
- **No internal limits**: `maxPages:0` = infinite, `depth:0` = infinite
- **Vision** - HTML analysis like eyes, captcha detection
- **Infinite scroll** - auto paginated link following
- **Auto-clicker** - automatic clicks on selectors
- **Turbo V3** - 4.85 pages/second with keep-alive + gzip

## Usage

```bash
# Simple - 50 pages, depth 3
npm run crawl -- --url https://example.com --max 50

# Mad Dog - infinite (be careful!)
npm run crawl -- --url https://example.com --max 0 --depth 0 --concurrency 20 --playwright

# Custom storage
npm run crawl -- --url https://quotes.toscrape.com --out D:\opencode-cache\mcp\quotes.db

# Turbo - light speed
npx tsx src/crawler-turbo.ts --url https://quotes.toscrape.com --max 30 --concurrency 30

# Vision + infinite scroll
npx tsx src/crawler-vision.ts --url https://example.com --scroll 5

# Auto-clicker
npx tsx src/crawler-vision.ts --url https://example.com --click "button.load-more"

# Auto-register (only your own site with permission)
npx tsx src/crawler-vision.ts --url https://your-site.com/register --register test@your-site.com --password Test123!
```

## Examples

```bash
# Quick test
npx tsx src/crawler-lite.ts --url https://example.com --max 5

# Real site with JS
npx tsx src/crawler.ts --url https://quotes.toscrape.com --max 10 --playwright

# Turbo benchmark
npx tsx src/crawler-turbo.ts --url https://quotes.toscrape.com --max 30 --concurrency 30
# Result: 30 pages in 6.18s = 4.85 pages/sec
```

## ⚠️ Legal Warning
Use only for public sites and respect `robots.txt` and `ToS`.
Bypassing login, paywall, or captcha without permission is **illegal**.
You are responsible for usage. For your own site, use reCAPTCHA test keys:
`6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`

## Install
```bash
cd D:\opencode-projects\mad-dog-crawler
npm install
npx playwright install chromium
```

Built with OpenCode - more powerful than Claude Code
