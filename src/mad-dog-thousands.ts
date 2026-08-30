#!/usr/bin/env node
/**
 * MAD DOG THOUSANDS - هزاران کار یکجا
 * D:\opencode-projects\mad-dog-crawler\src\mad-dog-thousands.ts
 * 
 * هزاران URL را یکجا با concurrency 100-500 می‌خزد
 * Wired to BRAIN
 */

import PQueue from 'p-queue'
import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'

type Job = { url: string; depth: number }

class ThousandsCrawler {
  private queue: PQueue
  private visited = new Set<string>()
  private results: any[] = []
  private start = performance.now()
  private done = 0
  private errors = 0

  constructor(private concurrency: number, private max: number) {
    // هزاران همزمان - 100 تا 500
    this.queue = new PQueue({ concurrency, intervalCap: 1000, interval: 200 })
    console.log(`🐕‍🦺 THOUSANDS - concurrency ${concurrency} | max ${max || '∞'}`)
  }

  async run(urls: string[]) {
    console.log(`🚀 Starting ${urls.length} jobs...`)
    for (const url of urls) this.add(url, 0)
    await this.queue.onIdle()
    const elapsed = ((performance.now() - this.start) / 1000).toFixed(2)
    console.log(`\n✅ THOUSANDS done - ${this.done} fetched, ${this.errors} errors in ${elapsed}s = ${(this.done / parseFloat(elapsed)).toFixed(1)}/s`)
    console.log(`📊 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB | Visited: ${this.visited.size}`)
    return this.results
  }

  private add(url: string, depth: number) {
    if (this.visited.has(url) || (this.max !== 0 && this.visited.size >= this.max)) return
    this.visited.add(url)
    this.queue.add(async () => {
      try {
        const t0 = performance.now()
        const res = await fetch(url, { headers: { 'User-Agent': 'MadDog-Thousands/1.0' } })
        const text = await res.text()
        const ms = (performance.now() - t0).toFixed(0)
        this.results.push({ url, status: res.status, ms, len: text.length, at: new Date().toISOString() })
        this.done++
        if (this.done % 50 === 0) console.log(`⚡ [${this.done}] ${url.slice(0, 60)} ${ms}ms`)
      } catch (e: any) {
        this.errors++
      }
    })
  }

  save(out: string) {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, JSON.stringify({ count: this.done, results: this.results.slice(0, 20) }, null, 2), 'utf-8')
    console.log(`💾 ${out}`)
  }
}

// CLI
import { Command } from 'commander'
const program = new Command()
program
  .option('--file <path>', 'File with URLs (one per line)', '')
  .option('--count <n>', 'Generate N fake URLs for test', '0')
  .option('--concurrency <n>', 'Concurrency 10-500', '100')
  .option('--max <n>', 'Max 0=∞', '1000')
  .option('--out <path>', 'Output', 'D:\\opencode-cache\\mcp\\thousands.json')
  .action(async (o) => {
    let urls: string[] = []
    if (o.file && fs.existsSync(o.file)) {
      urls = fs.readFileSync(o.file, 'utf-8').split('\n').filter(Boolean)
    } else if (parseInt(o.count) > 0) {
      // تست: هزاران URL از jsonplaceholder
      const n = parseInt(o.count)
      urls = Array.from({ length: n }, (_, i) => `https://jsonplaceholder.typicode.com/posts/${(i % 100) + 1}?test=${i}`)
      console.log(`🧪 Generated ${n} test URLs`)
    } else {
      urls = ['https://example.com', 'https://httpbin.org/get', 'https://reqres.in/api/users']
    }
    const c = new ThousandsCrawler(parseInt(o.concurrency), parseInt(o.max))
    await c.run(urls)
    c.save(o.out)
  })
program.parse()
