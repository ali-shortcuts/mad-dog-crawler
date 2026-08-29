#!/usr/bin/env node
/**
 * MAD DOG V2 - سگ دیوانه ارتقا یافته
 * ویژن + اسکرول بی‌نهایت + اوتو-کلیکر + ثبت‌نام خودکار (فقط سایت خودت)
 * D:\opencode-projects\mad-dog-crawler\src\crawler-vision.ts:1
 * 
 * برای سایت خودت: کپچا را در حالت dev با کلید تست غیرفعال کن، نه دور بزن
 * - reCAPTCHA test key: sitekey 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
 * - یا در سرور خودت CAPTCHA را برای IP تست خاموش کن
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

  // ویژن: تحلیل HTML مثل چشم
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

  // اسکرول بی‌نهایت (شبیه‌سازی: همه لینک‌های paginated را دنبال می‌کند)
  async infiniteScrollFetch(startUrl: string, maxScrolls = 10) {
    let url = startUrl
    let scroll = 0
    while (url && scroll < maxScrolls) {
      console.log(`📜 اسکرول ${scroll + 1}/${maxScrolls} -> ${url}`)
      const res = await fetch(url)
      const html = await res.text()
      const vision = this.analyzeVision(html, url)
      
      if (vision.hasCaptcha) {
        console.log(`⚠️ کپچا شناسایی شد در ${url} - توقف برای حل دستی (برای سایت خودت: از کلید تست استفاده کن)`)
        console.log(`   reCAPTCHA test sitekey: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`)
        // مکث - حل دستی، نه دور زدن خودکار
        break
      }

      const $ = cheerio.load(html)
      this.results.push({ url, title: $('title').text(), vision, at: new Date().toISOString() })
      this.visited.add(url)

      // پیدا کردن لینک "بعدی" برای اسکرول
      const next = $('a[rel="next"], a:contains("Next"), a:contains("بعدی"), button:contains("Load more")').attr('href')
      if (next) url = new URL(next, url).toString()
      else {
        // دنبال همه لینک‌های داخلی برای خزش
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

  // اوتو-کلیکر: کلیک خودکار روی سلکتور
  async autoClick(url: string, selector: string) {
    console.log(`🖱️ اوتو-کلیکر: ${selector} در ${url}`)
    const res = await fetch(url)
    const html = await res.text()
    const $ = cheerio.load(html)
    const el = $(selector)
    if (el.length === 0) { console.log(`❌ المنت ${selector} پیدا نشد`); return }
    const href = el.attr('href') || el.attr('data-href')
    const action = el.attr('hx-get') || href
    console.log(`✅ کلیک روی ${selector} -> ${action || 'form submit'}`)
    if (action) {
      const nextUrl = new URL(action, url).toString()
      await this.infiniteScrollFetch(nextUrl, 3)
    }
  }

  // ثبت‌نام خودکار (فقط سایت خودت - با اجازه)
  async autoRegister(url: string, user: { email: string; password: string; name?: string }) {
    console.log(`📝 ثبت‌نام خودکار در ${url} برای ${user.email}`)
    const res = await fetch(url)
    const html = await res.text()
    const vision = this.analyzeVision(html, url)
    
    if (vision.hasCaptcha) {
      console.log(`⚠️ کپچا فعال است - برای سایت خودت:`)
      console.log(`   1. در env سایت بگذار: RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI (کلید تست گوگل)`)
      console.log(`   2. یا برای IP خودت کپچا را خاموش کن`)
      console.log(`   3. سپس دوباره اجرا کن - نه دور زدن`)
      return { success: false, reason: 'captcha_requires_manual_or_test_key' }
    }

    if (vision.forms.length === 0) { console.log(`❌ فرمی پیدا نشد`); return { success: false } }
    
    const form = vision.forms[0]
    console.log(`📋 فرم پیدا شد: ${form.action} با فیلدها: ${form.inputs.join(', ')}`)
    
    // پر کردن خودکار - فقط فیلدهای استاندارد
    const body = new URLSearchParams()
    for (const name of form.inputs) {
      if (name.includes('email')) body.set(name, user.email)
      else if (name.includes('pass')) body.set(name, user.password)
      else if (name.includes('name') || name.includes('user')) body.set(name, user.name || 'Test User')
      else if (name !== 'unknown') body.set(name, 'test')
    }

    console.log(`📤 ارسال به ${form.action} با ${body.toString().slice(0,100)}...`)
    // در سایت خودت اگر CSRF دارد، اول توکن را از html بگیر
    const $ = cheerio.load(html)
    const csrf = $('input[name="_csrf"], input[name="csrf_token"], meta[name="csrf-token"]').attr('value') || $('meta[name="csrf-token"]').attr('content')
    if (csrf) body.set('_csrf', csrf)

    // ارسال واقعی - فقط اگر سایت خودت باشد
    try {
      const target = new URL(form.action, url).toString()
      const resp = await fetch(target, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      const text = await resp.text()
      console.log(`📥 پاسخ: ${resp.status} - ${text.slice(0,300)}`)
      // API را استخراج کن - لینک‌های /api
      const apiLinks = [...text.matchAll(/\/api\/[a-z0-9\/_-]+/gi)].map(m=>m[0]).slice(0,5)
      if (apiLinks.length) console.log(`🔌 API های پیدا شده: ${apiLinks.join(', ')}`)
      return { success: resp.ok, status: resp.status, apis: apiLinks }
    } catch (e:any) { console.log(`❌ خطا: ${e.message}`); return { success: false, error: e.message } }
  }

  save(out: string) {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, JSON.stringify({ results: this.results, count: this.results.length }, null, 2), 'utf-8')
    console.log(`💾 ذخیره شد: ${out}`)
  }
}

const program = new Command()
program
  .option('--url <url>', 'URL شروع', 'https://example.com')
  .option('--scroll <n>', 'اسکرول بی‌نهایت', '5')
  .option('--click <selector>', 'اوتو-کلیکر selector', '')
  .option('--register <email>', 'ایمیل تست ثبت‌نام (فقط سایت خودت)', '')
  .option('--password <pass>', 'پسورد تست', 'Test123!')
  .option('--out <path>', 'خروجی', 'D:\\opencode-cache\\mcp\\mad-dog-v2.json')
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
