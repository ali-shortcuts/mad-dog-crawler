#!/usr/bin/env node
/**
 * MAD DOG API FINDER - پیدا کردن API از سایت مثل انسان
 * D:\opencode-projects\mad-dog-crawler\src\crawler-api-finder.ts
 * 
 * مثل تو که از سایت API آوردی (sk-..., AIza...), این ربات هم API endpoint ها را پیدا می‌کند
 * - نه کلید مخفی دیگران را می‌دزدد (غیرقانونی)
 * - بلکه endpoint های عمومی /api/* و Swagger/OpenAPI را کشف می‌کند
 * - برای سایت خودت: با لاگین خودت می‌تواند کلید خودت را بسازد (با API رسمی)
 */

import * as cheerio from 'cheerio'
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'

type ApiFound = { url: string; method: string; source: string }

class ApiFinder {
  private apis: ApiFound[] = []
  private visited = new Set<string>()

  async findApis(startUrl: string, maxPages = 20) {
    console.log(`🔍 API FINDER - like you, but automatic`)
    console.log(`   Start: ${startUrl} | max: ${maxPages}`)
    await this.crawl(startUrl, 0, maxPages)
    return this.apis
  }

  private async crawl(url: string, depth: number, max: number) {
    if (this.visited.has(url) || this.visited.size >= max || depth > 3) return
    this.visited.add(url)
    try {
      console.log(`[${this.visited.size}] 🔎 ${url}`)
      const res = await fetch(url, { headers: { 'User-Agent': 'MadDog-API-Finder/1.0' } })
      const html = await res.text()
      const $ = cheerio.load(html)

      // 1. پیدا کردن /api/* لینک‌ها (مثل تو)
      const apiRegex = /\/api\/[a-zA-Z0-9\/_\-\?=&\.]+/g
      const matches = [...html.matchAll(apiRegex)]
      for (const m of matches) {
        const apiUrl = new URL(m[0], url).toString()
        if (!this.apis.find(a => a.url === apiUrl)) {
          this.apis.push({ url: apiUrl, method: 'GET', source: url })
          console.log(`   🔌 API found: ${apiUrl}`)
        }
      }

      // 2. پیدا کردن Swagger / OpenAPI
      const swaggerLinks: string[] = []
      $('a[href*="swagger"], a[href*="openapi"], a[href*="docs/api"], link[href*="swagger"]').each((_, a) => {
        try { swaggerLinks.push(new URL($(a).attr('href')!, url).toString()) } catch {}
      })
      if (swaggerLinks.length) console.log(`   📄 Swagger: ${swaggerLinks.join(', ')}`)

      // 3. پیدا کردن fetch/ajax در JS
      const jsApis: string[] = []
      $('script').each((_, s) => {
        const js = $(s).html() || ''
        const fetchMatches = [...js.matchAll(/fetch\(['"]([^'"]+api[^'"]+)['"]/gi)]
        for (const f of fetchMatches) jsApis.push(f[1])
      })
      for (const j of jsApis) console.log(`   ⚡ JS API: ${j}`)

      // دنبال لینک‌های داخلی
      const links: string[] = []
      $('a[href]').each((_, a) => {
        try {
          const abs = new URL($(a).attr('href')!, url).toString()
          if (abs.startsWith('http') && new URL(abs).hostname === new URL(startUrl).hostname) links.push(abs)
        } catch {}
      })
      for (const l of links.slice(0, 5)) await this.crawl(l, depth + 1, max)

    } catch (e: any) { console.log(`❌ ${url}: ${e.message.slice(0, 60)}`) }
  }

  save(out: string) {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, JSON.stringify({ found: this.apis.length, apis: this.apis, visited: [...this.visited] }, null, 2), 'utf-8')
    console.log(`\n✅ Found ${this.apis.length} APIs`)
    console.log(`💾 ${out}`)
    if (this.apis.length) console.log(this.apis.map(a => `  - ${a.url} (from ${a.source})`).join('\n'))
    else console.log(`   No /api/* found - try your own site with /api/* endpoints`)
  }
}

const program = new Command()
program
  .option('--url <url>', 'Site URL', 'https://jsonplaceholder.typicode.com')
  .option('--max <n>', 'Max pages', '20')
  .option('--out <path>', 'Output', 'D:\\opencode-cache\\mcp\\found-apis.json')
  .action(async (o) => {
    const finder = new ApiFinder()
    await finder.findApis(o.url, parseInt(o.max))
    finder.save(o.out)
  })
program.parse()
