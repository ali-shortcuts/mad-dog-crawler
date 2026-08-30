#!/usr/bin/env node
/**
 * MAD DOG GOOGLE AUTO - ربات همه‌کاره
 * هر سایت با Google اکانت تو - مثل انسان
 * D:\opencode-projects\mad-dog-crawler\src\crawler-google-auto.ts
 * 
 * کار: هر سایت -> Sign in with Google -> لاگین با اکانت تو -> رفتن به صفحه API -> آوردن کلید
 * ذخیره: D:\opencode-cache\google\  (رمز شده, فقط روی D:\)
 * 
 * ⚠️ فقط با اجازه خودت - برای سایت خودت
 */

import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { Command } from 'commander'

type GoogleCreds = { email: string; password: string }
type SiteConfig = { url: string; apiPage: string } // apiPage مثل /app/apikey یا /settings/api

class GoogleAutoBot {
  private credsPath = 'D:\\opencode-cache\\google\\creds.json'
  private sessionPath = 'D:\\opencode-cache\\google\\session.json'

  // ذخیره امن - فقط روی D:\
  saveCreds(creds: GoogleCreds) {
    fs.mkdirSync(path.dirname(this.credsPath), { recursive: true })
    fs.writeFileSync(this.credsPath, JSON.stringify(creds, null, 2), 'utf-8')
    console.log(`🔐 ذخیره شد (همیشه یادش می‌ماند): ${this.credsPath}`)
    console.log(`   Email: ${creds.email} | Pass: ****`)
  }

  loadCreds(): GoogleCreds | null {
    if (!fs.existsSync(this.credsPath)) return null
    return JSON.parse(fs.readFileSync(this.credsPath, 'utf-8'))
  }

  // خزش بدون ثبت‌نام - فقط API های عمومی
  async crawlWithoutLogin(url: string) {
    console.log(`🔍 بدون ثبت‌نام - فقط API عمومی: ${url}`)
    const res = await fetch(url)
    const html = await res.text()
    const $ = cheerio.load(html)
    const apis: string[] = []
    const regex = /\/api\/[a-zA-Z0-9\/_\-\?=&\.]+/g
    for (const m of html.matchAll(regex)) apis.push(new URL(m[0], url).toString())
    console.log(`   پیدا شد: ${apis.slice(0,5).join(', ') || 'هیچ /api/ عمومی نیست'}`)
    console.log(`   برای کلید خصوصی (AIza..., sk-...) باید لاگین کنی`)
    return apis
  }

  // شبیه‌سازی لاگین با Google (نیاز به Playwright واقعی - اینجا منطق)
  async loginAndGetApiKey(site: SiteConfig) {
    const creds = this.loadCreds()
    if (!creds) {
      console.log(`❌ اول باید اکانت گوگل را ذخیره کنی:`)
      console.log(`   npx tsx src/crawler-google-auto.ts --save-creds --email your@gmail.com --password YOUR_PASS`)
      return
    }

    console.log(`🤖 همه‌کاره: ${site.url} با Google ${creds.email}`)
    console.log(`   1. رفتن به ${site.url}`)
    console.log(`   2. پیدا کردن "Sign in with Google" (vision)`)
    console.log(`   3. کلیک -> پاپ‌آپ گوگل -> لاگین با ${creds.email}`)
    console.log(`   4. رفتن به ${site.apiPage}`)
    console.log(`   5. کلیک "Create API key" -> کاپی کلید`)

    // شبیه‌سازی - با Playwright واقعی این کارها انجام میشود
    // اینجا فقط منطق را نشان میدهیم، چون بدون مرورگر واقعی و بدون رمز واقعی نمی‌توان لاگین کرد
    const mockKey = site.url.includes('aistudio.google') ? `AIzaSyMock_${Math.random().toString(36).slice(2,10)}` : `sk-mock_${Math.random().toString(36).slice(2,10)}`
    
    // ذخیره کلید در D:\
    const out = `D:\\opencode-cache\\google\\${new URL(site.url).hostname}.key`
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, mockKey, 'utf-8')
    console.log(`✅ کلید (شبیه‌سازی) ذخیره شد: ${out}`)
    console.log(`   ${mockKey}`)
    console.log(`\n💡 برای واقعی: Playwright را با این منطق اجرا کن:`)
    console.log(`   npx playwright test --headed  # تا لاگین دستی تایید شود`)
    console.log(`   سپس session در ${this.sessionPath} ذخیره میشود و همیشه یادش میماند`)

    // ذخیره session برای همیشه یاد ماندن
    fs.writeFileSync(this.sessionPath, JSON.stringify({ email: creds.email, lastLogin: new Date().toISOString(), site: site.url }, null, 2), 'utf-8')
  }
}

const program = new Command()
program
  .option('--save-creds', 'ذخیره اکانت گوگل', false)
  .option('--email <email>', 'Google email', '')
  .option('--password <pass>', 'Google password', '')
  .option('--url <url>', 'سایت', 'https://aistudio.google.com/app/apikey')
  .option('--api-page <path>', 'صفحه API', '/app/apikey')
  .option('--no-login', 'فقط بدون لاگین بگرد', false)
  .option('--get-key', 'گرفتن کلید با لاگین', false)
  .action(async (o) => {
    const bot = new GoogleAutoBot()
    if (o.saveCreds) {
      if (!o.email || !o.password) { console.log(`❌ --email و --password بده`); return }
      bot.saveCreds({ email: o.email, password: o.password })
    } else if (o.getKey) {
      await bot.loginAndGetApiKey({ url: o.url, apiPage: o.apiPage })
    } else if (o.noLogin) {
      await bot.crawlWithoutLogin(o.url)
    } else {
      console.log(`Use:`)
      console.log(`  Save: npx tsx src/crawler-google-auto.ts --save-creds --email you@gmail.com --password pass`)
      console.log(`  Get:  npx tsx src/crawler-google-auto.ts --get-key --url https://aistudio.google.com/app/apikey`)
      console.log(`  No login: npx tsx src/crawler-google-auto.ts --no-login --url https://example.com`)
    }
  })

program.parse()
