#!/usr/bin/env node
/**
 * MAD DOG V2 - Vision + Infinite Scroll + Auto-Clicker + Auto-Register (only your own site)
 * D:\opencode-projects\mad-dog-crawler\src\crawler-vision.ts:1
 * 
 * For your own site: disable captcha in dev with test key, don't bypass
 * - reCAPTCHA test key: sitekey 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
 * - Or disable CAPTCHA for test IP on your server
 */

import * as cheerio from 'cheerio'
import PQueue from 'p-queue'
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'

type VisionResult = { hasCaptcha: boolean; forms: { action: string; inputs: string[] }[]; buttons: string[] }

class MadDogVision {
  private queue = new PQueue({ concurrency: 5 })
  private visited = new Set<string>()
  private results: any[] = []

  // Vision: analyze HTML like eyes
  analyzeVision(html: string, url: string): VisionResult {
    const $ = cheerio.load(html)
    const hasCaptcha = html.includes('captcha') || html.includes('g-recaptcha') || html.includes('hcaptcha') || $('iframe[src*="captcha"]').length > 0
    const forms: any[] = []
    $('form').each((_, f) => {
      const action = $(f).attr('action') || url
      const inputs: string[] = []
      $(f).find('input, select, textarea').each((_, i) => inputs.push($(i).attr('name') || $(i).attr('id') || $(i).attr('type') || 'unknown'))
      forms.push({ action, inputs })
    })
    const buttons: string[] = []
    $('button, a.btn, input[type="submit"]').each((_, b) => buttons.push($(b).text().trim().slice(0, 50) || $(b).attr('value') || 'button'))
    return { hasCaptcha, forms, buttons }
  }

  // Infinite scroll (simulated: follow all paginated links)
  async infiniteScrollFetch(startUrl: string, maxScrolls = 10) {
    let url = startUrl
    let scroll = 0
    while (url && scroll < maxScrolls) {
      console.log(`📜 Scroll ${scroll + 1}/${maxScrolls} -> ${url}`)
      const res = await fetch(url)
      const html = await res.text()
      const vision = this.analyzeVision(html, url)
      
      if (vision.hasCaptcha) {
        console.log(`⚠️ Captcha detected at ${url} - pause for manual solve (for your own site: use test key)`)
        console.log(`   reCAPTCHA test sitekey: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`)
        // Pause - manual solve, no auto bypass
        break
      }

      const $ = cheerio.load(html)
      this.results.push({ url, title: $('title').text(), vision, at: new Date().toISOString() })
      this.visited.add(url)

      // Find "next" link for scroll
      const next = $('a[rel="next"], a:contains("Next"), button:contains("Load more")').attr('href')
      if (next) url = new URL(next, url).toString()
      else {
        // Follow all internal links
        const links: string[] = []
        $('a[href]').each((_, a) => {
          try { const abs = new URL($(a).attr('href')!, url).toString(); if (abs.startsWith('http') && new URL(abs).hostname === new URL(startUrl).hostname) links.push(abs) } catch {}
        })
        for (const l of links.slice(0, 3)) if (!this.visited.has(l)) await this.infiniteScrollFetch(l, maxScrolls - scroll - 1)
        break
      }
      scroll++
    }
  }

  // Auto-clicker: automatic click on selector
  async autoClick(url: string, selector: string) {
    console.log(`🖱️ Auto-clicker: ${selector} at ${url}`)
    const res = await fetch(url)
    const html = await res.text()
    const $ = cheerio.load(html)
    const el = $(selector)
    if (el.length === 0) { console.log(`❌ Element ${selector} not found`); return }
    const href = el.attr('href') || el.attr('data-href')
    const action = el.attr('hx-get') || href
    console.log(`✅ Click on ${selector} -> ${action || 'form submit'}`)
    if (action) {
      const nextUrl = new URL(action, url).toString()
      await this.infiniteScrollFetch(nextUrl, 3)
    }
  }

  // Auto-register (only your own site - with permission)
  async autoRegister(url: string, user: { email: string; password: string; name?: string }) {
    console.log(`📝 Auto-register at ${url} for ${user.email}`)
    const res = await fetch(url)
    const html = await res.text()
    const vision = this.analyzeVision(html, url)
    
    if (vision.hasCaptcha) {
      console.log(`⚠️ Captcha active - for your own site:`)
      console.log(`   1. Set env: RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI (Google test key)`)
      console.log(`   2. Or disable captcha for your IP`)
      console.log(`   3. Then run again - no bypass`)
      return { success: false, reason: 'captcha_requires_manual_or_test_key' }
    }

    if (vision.forms.length === 0) { console.log(`❌ No form found`); return { success: false } }
    
    const form = vision.forms[0]
    console.log(`📋 Form found: ${form.action} with fields: ${form.inputs.join(', ')}`)
    
    // Auto fill - only standard fields
    const body = new URLSearchParams()
    for (const name of form.inputs) {
      if (name.includes('email')) body.set(name, user.email)
      else if (name.includes('pass')) body.set(name, user.password)
      else if (name.includes('name') || name.includes('user')) body.set(name, user.name || 'Test User')
      else if (name !== 'unknown') body.set(name, 'test')
    }

    console.log(`📤 Send to ${form.action} with ${body.toString().slice(0,100)}...`)
    // For your own site if CSRF, get token from html first
    const $ = cheerio.load(html)
    const csrf = $('input[name="_csrf"], input[name="csrf_token"], meta[name="csrf-token"]').attr('value') || $('meta[name="csrf-token"]').attr('content')
    if (csrf) body.set('_csrf', csrf)

    // Real send - only if your own site
    try {
      const target = new URL(form.action, url).toString()
      const resp = await fetch(target, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      const text = await resp.text()
      console.log(`📥 Response: ${resp.status} - ${text.slice(0,300)}`)
      // Extract API - links /api
      const apiLinks = [...text.matchAll(/\/api\/[a-z0-9\/_-]+/gi)].map(m=>m[0]).slice(0,5)
      if (apiLinks.length) console.log(`🔌 APIs found: ${apiLinks.join(', ')}`)
      return { success: resp.ok, status: resp.status, apis: apiLinks }
    } catch (e:any) { console.log(`❌ Error: ${e.message}`); return { success: false, error: e.message } }
  }

  save(out: string) {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, JSON.stringify({ results: this.results, count: this.results.length }, null, 2), 'utf-8')
    console.log(`💾 Saved: ${out}`)
  }
}

const program = new Command()
program
  .option('--url <url>', 'Start URL', 'https://example.com')
  .option('--scroll <n>', 'Infinite scroll', '5')
  .option('--click <selector>', 'Auto-clicker selector', '')
  .option('--register <email>', 'Test email for register (only your own site)', '')
  .option('--password <pass>', 'Test password', 'Test123!')
  .option('--out <path>', 'Output', 'D:\\opencode-cache\\mcp\\mad-dog-v2.json')
  .action(async (o) => {
    const bot = new MadDogVision()
    if (o.register) {
      await bot.autoRegister(o.url, { email: o.register, password: o.password })
    } else if (o.click) {
      await bot.autoClick(o.url, o.click)
    } else {
      await bot.infiniteScrollFetch(o.url, parseInt(o.scroll))
    }
    bot.save(o.out)
  })

program.parse()
