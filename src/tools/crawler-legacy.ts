#!/usr/bin/env node
/**
 * MAD DOG CRAWLER
 * Infinitely powerful for rainy day - No internal limits
 * Stored on D:\ to save C:
 * 
 * ⚠️ Legal: Only for public sites with permission
 * You are responsible - respect robots.txt and ToS
 */

import * as cheerio from 'cheerio'
import PQueue from 'p-queue'
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'

type Config = {
  startUrl: string
  maxPages: number // 0 = infinite
  concurrency: number
  depth: number // 0 = infinite
  usePlaywright: boolean
  saveTo: string
}

class MadDogCrawler {
  private queue: PQueue
  private visited = new Set<string>()
  private config: Config

  constructor(config: Config) {
    this.config = config
    // DB on D:\opencode-cache\mcp\memory.db or project
    const dbPath = config.saveTo.endsWith('.db') ? config.saveTo : path.join(config.saveTo, 'crawl.db')
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    // Note: DB logic simplified - use JSON for lite version
    // This file is template for full DB version with better-sqlite3
    
    // No internal limits - high concurrency, infinite queue
    this.queue = new PQueue({ concurrency: config.concurrency, intervalCap: 1000, interval: 1000 })
    console.log(`🐕‍🦺 MAD DOG ready - DB: ${dbPath}`)
    console.log(`   URL: ${config.startUrl} | maxPages: ${config.maxPages || '∞'} | concurrency: ${config.concurrency} | depth: ${config.depth || '∞'}`)
  }

  async start() {
    console.log('🎭 Use crawler-lite.ts or crawler-turbo.ts for active version')
    console.log('This file is template - see crawler-lite.ts for working implementation')
  }
}

// CLI - No limits
const program = new Command()
program
  .option('--url <url>', 'Start URL', 'https://example.com')
  .option('--max <n>', 'Max pages (0=infinite)', '50')
  .option('--concurrency <n>', 'Concurrency (mad dog = 10-20)', '5')
  .option('--depth <n>', 'Depth (0=infinite)', '3')
  .option('--playwright', 'Use real browser (JS)', false)
  .option('--out <path>', 'DB path', 'D:\\opencode-cache\\mcp\\mad-dog.db')
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
