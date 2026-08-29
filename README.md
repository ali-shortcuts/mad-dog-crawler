# 🐕‍🦺 MAD DOG CRAWLER - سگ دیوانه

**بی‌نهایت قدرتمند برای روز مبادا - بدون محدودیت داخلی**

ساخته شده روی `D:\opencode-projects\mad-dog-crawler` - ذخیره در `D:\opencode-cache\mcp\mad-dog.db` تا `C:` پر نشود.

## قدرت‌ها
- **Playwright** مرورگر واقعی - JS رندر کامل
- **Cheerio + fetch** سریع برای سایت‌های ساده
- **PQueue** همزمانی بی‌نهایت (concurrency قابل تنظیم 1-100)
- **better-sqlite3** ذخیره `D:\` - 446MB کش قبلی + این DB
- **بدون محدودیت داخلی**: `maxPages:0` = بی‌نهایت، `depth:0` = بی‌نهایت

## استفاده

```bash
# ساده - 50 صفحه، عمق 3
npm run crawl -- --url https://example.com --max 50

# سگ دیوانه - بی‌نهایت (مواظب باش!)
npm run crawl -- --url https://example.com --max 0 --depth 0 --concurrency 20 --playwright

# ذخیره سفارشی
npm run crawl -- --url https://quotes.toscrape.com --out D:\opencode-cache\mcp\quotes.db
```

## مثال‌ها

```bash
# تست سریع
npx tsx src/crawler.ts --url https://example.com --max 5

# سایت واقعی با JS
npx tsx src/crawler.ts --url https://quotes.toscrape.com --max 10 --playwright
```

## ⚠️ هشدار قانونی
فقط برای سایت‌های عمومی و با رعایت `robots.txt` و `ToS` استفاده کن.
دور زدن لاگین، پی‌وال، کپچا بدون اجازه **غیرقانونی** است.
مسئولیت استفاده با توست.

## نصب
```bash
cd D:\opencode-projects\mad-dog-crawler
npm install
npx playwright install chromium
```

ساخته شده با OpenCode قدرتمند - قوی‌تر از Claude Code
