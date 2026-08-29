#!/usr/bin/env node
/**
 * MAD DOG CRAWLER - سگ دیوانه
 * بی‌نهایت قدرتمند برای روز مبادا - بدون محدودیت داخلی
 * ذخیره روی D:\ برای صرفه‌جویی C:
 * 
 * ⚠️ هشدار قانونی: فقط برای سایت‌های عمومی و با اجازه استفاده کن
 * مسئولیت استفاده با توست - robots.txt و ToS را رعایت کن
 */

import * as cheerio from 'cheerio'
import PQueue from 'p-queue'
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'

type Config = {
  startUrl: string
  maxPages: number // 0 = بی‌نهایت
  concurrency: number
  depth: number // 0 = بی‌نهایت
  usePlaywright: boolean
  saveTo: string
}

class MadDogCrawler {
  private db: Database.Database
  private queue: PQueue
  private visited = new Set<string>()
  private browser: Browser | null = null
  private config: Config

  constructor(config: Config) {
    this.config = config
    // DB روی D:\opencode-cache\mcp\memory.db یا پروژه
    const dbPath = config.saveTo.endsWith('.db') ? config.saveTo : path.join(config.saveTo, 'crawl.db')
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.initDB()
    
    // بدون محدودیت داخلی - concurrency بالا، queue بی‌نهایت
    this.queue = new PQueue({ concurrency: config.concurrency, intervalCap: 1000, interval: 1000 })
    console.log(`🐕‍🦺 MAD DOG آماده - DB: ${dbPath}`)
    console.log(`   URL: ${config.startUrl} | maxPages: ${config.maxPages || '∞'} | concurrency: ${config.concurrency} | depth: ${config.depth || '∞'}`)
  }

  private initDB() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE,
        title TEXT,
        html TEXT,
        text TEXT,
        depth INTEGER,
        crawled_at TEXT
      );
      CREATE TABLE IF NOT EXISTS links (
        from_url TEXT,
        to_url TEXT
      );
    `)
  }

  async start() {
    if (this.config.usePlaywright) {
      this.browser = await chromium.launch({ headless: true })
      console.log('🎭 Playwright مرورگر واقعی فعال - JS رندر میشود')
    }

    await this.crawl(this.config.startUrl, 0)
    await this.queue.onIdle()
    
    if (this.browser) await this.browser.close()
    
    const count = this.db.prepare('SELECT COUNT(*) as c FROM pages').get() as { c: number }
    console.log(`\n✅ تمام - ${count.c} صفحه خزیده شد`)
    console.log(`📂 DB: ${this.config.saveTo}`)
    this.db.close()
  }

  private async crawl(url: string, depth: number) {
    if (this.visited.has(url)) return
    if (this.config.maxPages !== 0 && this.visited.size >= this.config.maxPages) return
    if (this.config.depth !== 0 && depth > this.config.depth) return
    
    this.visited.add(url)
    
    this.queue.add(async () => {
      try {
        console.log(`[${this.visited.size}] 🐾 ${url} (depth ${depth})`)
        let html: string
        let title = ''

        if (this.config.usePlaywright && this.browser) {
          const page = await this.browser.newPage()
          // استیلت - مثل انسان
          await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' })
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
          html = await page.content()
          title = await page.title()
          await page.close()
        } else {
          // سریع با fetch
          const res = await fetch(url, { headers: { 'User-Agent': 'MadDog/1.0 (+https://github.com/ali-shortcuts/mad-dog-crawler)' } })
          html = await res.text()
          const $ = cheerio.load(html)
          title = $('title').text()
        }

        const $ = cheerio.load(html)
        const text = $('body').text().replace(/\s+/g, ' ').slice(0, 5000)

        // ذخیره
        this.db.prepare('INSERT OR IGNORE INTO pages (url, title, html, text, depth, crawled_at) VALUES (?, ?, ?, ?, ?, ?)').run(url, title, html.slice(0, 50000), text, depth, new Date().toISOString())

        // لینک‌ها - بی‌نهایت
        const links: string[] = []
        $('a[href]').each((_, el) => {
          let href = $(el).attr('href')
          if (!href) return
          try {
            const absolute = new URL(href, url).toString()
            if (absolute.startsWith('http') && !absolute.includes('#')) {
              // فقط هم‌دومین - برای بینهایت واقعی این چک را بردار
              const startHost = new URL(this.config.startUrl).hostname
              const linkHost = new URL(absolute).hostname
              if (linkHost === startHost) links.push(absolute)
            }
          } catch {}
        })

        // ذخیره لینک‌ها
        const insertLink = this.db.prepare('INSERT INTO links VALUES (?, ?)')
        for (const l of links.slice(0, 100)) insertLink.run(url, l)

        // خزش بعدی - بدون محدودیت
        for (const link of links) {
          if (this.config.maxPages !== 0 && this.visited.size >= this.config.maxPages) break
          await this.crawl(link, depth + 1)
        }

      } catch (e: any) {
        console.log(`❌ خطا ${url}: ${e.message.slice(0, 100)}`)
      }
    })
  }
}

// CLI - بدون محدودیت
const program = new Command()
program
  .option('--url <url>', 'شروع URL', 'https://example.com')
  .option('--max <n>', 'حداکثر صفحات (0=بی‌نهایت)', '50')
  .option('--concurrency <n>', 'همزمانی (سگ دیوانه = 10-20)', '5')
  .option('--depth <n>', 'عمق (0=بی‌نهایت)', '3')
  .option('--playwright', 'استفاده از مرورگر واقعی (JS)', false)
  .option('--out <path>', 'مسیر DB', 'D:\\opencode-cache\\mcp\\mad-dog.db')
  .action(async (opts) => {
    const crawler = new MadDogCrawler({
      startUrl: opts.url,
      maxPages: parseInt(opts.max),
      concurrency: parseInt(opts.concurrency),
      depth: parseInt(opts.depth),
      usePlaywright: opts.playwright,
      saveTo: opts.out
    })
    await crawler.start()
  })

program.parse()
