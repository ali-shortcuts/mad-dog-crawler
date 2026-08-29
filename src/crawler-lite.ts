#!/usr/bin/env node
/**
 * MAD DOG LITE - سگ دیوانه سبک (بدون Playwright native + بدون better-sqlite3)
 * برای تست سریع بدون نیاز به حافظه زیاد - فقط fetch + cheerio + JSON
 * بعد میتوانی Playwright را اضافه کنی
 */

import * as cheerio from 'cheerio'
import PQueue from 'p-queue'
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'

type Config = { startUrl: string; maxPages: number; concurrency: number; depth: number; saveTo: string }

class MadDogLite {
  private queue: PQueue
  private visited = new Set<string>()
  private pages: any[] = []
  private config: Config

  constructor(config: Config) {
    this.config = config
    fs.mkdirSync(path.dirname(config.saveTo), { recursive: true })
    this.queue = new PQueue({ concurrency: config.concurrency })
    console.log(`🐕‍🦺 MAD DOG LITE - ${config.startUrl} | max:${config.maxPages||'∞'} conc:${config.concurrency} depth:${config.depth||'∞'}`)
  }

  async start() {
    await this.crawl(this.config.startUrl, 0)
    await this.queue.onIdle()
    // ذخیره JSON روی D:\
    const out = this.config.saveTo.endsWith('.json') ? this.config.saveTo : path.join(this.config.saveTo, 'crawl.json')
    fs.writeFileSync(out, JSON.stringify({ crawled: this.pages, count: this.pages.length, visited: [...this.visited] }, null, 2), 'utf-8')
    console.log(`\n✅ تمام - ${this.pages.length} صفحه در ${out}`)
  }

  private async crawl(url: string, depth: number) {
    if (this.visited.has(url)) return
    if (this.config.maxPages !== 0 && this.visited.size >= this.config.maxPages) return
    if (this.config.depth !== 0 && depth > this.config.depth) return
    this.visited.add(url)
    this.queue.add(async () => {
      try {
        console.log(`[${this.visited.size}] 🐾 ${url}`)
        const res = await fetch(url, { headers: { 'User-Agent': 'MadDog/1.0' } })
        const html = await res.text()
        const $ = cheerio.load(html)
        const title = $('title').text().slice(0,200)
        const text = $('body').text().replace(/\s+/g,' ').slice(0,3000)
        this.pages.push({ url, title, text, depth, at: new Date().toISOString() })
        // لینک‌ها
        const links: string[] = []
        $('a[href]').each((_, el) => {
          let href = $(el).attr('href')
          if (!href) return
          try {
            const abs = new URL(href, url).toString()
            if (abs.startsWith('http') && !abs.includes('#')) {
              const startHost = new URL(this.config.startUrl).hostname
              if (new URL(abs).hostname === startHost) links.push(abs)
            }
          } catch {}
        })
        for (const l of links) await this.crawl(l, depth+1)
      } catch (e:any) { console.log(`❌ ${url}: ${e.message.slice(0,80)}`) }
    })
  }
}

const program = new Command()
program.option('--url <url>','URL','https://example.com').option('--max <n>','max 0=∞','5').option('--concurrency <n>','conc','5').option('--depth <n>','depth 0=∞','2').option('--out <path>','out','D:\\opencode-cache\\mcp\\mad-dog.json').action(async o=>{
  const c=new MadDogLite({startUrl:o.url,maxPages:parseInt(o.max),concurrency:parseInt(o.concurrency),depth:parseInt(o.depth),saveTo:o.out})
  await c.start()
})
program.parse()
