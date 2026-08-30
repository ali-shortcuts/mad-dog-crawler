/**
 * MAD DOG BRAIN - Single Intelligence, Auto Tool Calling
 * D:\opencode-projects\mad-dog-crawler\src\brain\index.ts
 * 
 * One brain that automatically calls needed tools in one request
 * Wires: lite, turbo, vision, auto-auth, api-finder, context7, memory, github
 */

import fs from 'fs'
import path from 'path'

type Tool = 'lite' | 'turbo' | 'vision' | 'auto-auth' | 'api-finder' | 'memory' | 'github'
type Plan = { tools: Tool[]; reason: string; params: any }

export class MadDogBrain {
  private memoryPath = 'D:\\opencode-cache\\mcp\\brain-memory.json'
  private memory: any = {}

  constructor() {
    if (fs.existsSync(this.memoryPath)) this.memory = JSON.parse(fs.readFileSync(this.memoryPath, 'utf-8'))
  }

  // Strong AI: sequential-thinking + memory
  think(request: string): Plan {
    const r = request.toLowerCase()
    console.log(`🧠 BRAIN thinking: "${request}"`)

    // Auto-decide tools in one request
    const tools: Tool[] = []
    let reason = ''

    if (r.includes('api') || r.includes('token')) {
      tools.push('api-finder')
      reason += 'Need API discovery -> api-finder; '
    }
    if (r.includes('login') || r.includes('register') || r.includes('google') || r.includes('auth')) {
      tools.push('auto-auth')
      reason += 'Need auth -> auto-auth; '
    }
    if (r.includes('scroll') || r.includes('click') || r.includes('vision') || r.includes('captcha')) {
      tools.push('vision')
      reason += 'Need vision/scroll -> vision; '
    }
    if (r.includes('turbo') || r.includes('fast') || r.includes('light speed') || r.includes('100')) {
      tools.push('turbo')
      reason += 'Need speed -> turbo; '
    }
    if (r.includes('crawl') || r.includes('scrape') || r.includes('fetch')) {
      if (!tools.includes('turbo') && !tools.includes('vision')) tools.push('lite')
      reason += 'Need crawl -> lite; '
    }
    if (tools.length === 0) { tools.push('lite'); reason = 'Default -> lite; ' }

    // Always remember
    tools.push('memory')
    reason += 'Remember -> memory'

    const plan: Plan = { tools, reason, params: { request, url: this.extractUrl(request) } }
    console.log(`🧠 Plan: [${tools.join(' -> ')}]`)
    console.log(`   Reason: ${reason}`)
    return plan
  }

  private extractUrl(s: string): string {
    const m = s.match(/https?:\/\/[^\s]+/)
    return m ? m[0] : 'https://example.com'
  }

  async execute(plan: Plan) {
    console.log(`\n🚀 BRAIN executing ${plan.tools.length} tools in one request...\n`)
    const results: any = {}

    for (const tool of plan.tools) {
      console.log(`\n▶️ Calling ${tool}...`)
      switch (tool) {
        case 'lite':
          results.lite = await this.callLite(plan.params.url)
          break
        case 'turbo':
          results.turbo = await this.callTurbo(plan.params.url)
          break
        case 'vision':
          results.vision = await this.callVision(plan.params.url)
          break
        case 'api-finder':
          results.apiFinder = await this.callApiFinder(plan.params.url)
          break
        case 'auto-auth':
          results.autoAuth = await this.callAutoAuth(plan.params.url)
          break
        case 'memory':
          results.memory = this.remember(plan)
          break
      }
    }

    console.log(`\n✅ BRAIN done - all tools called in one request`)
    this.save(results)
    return results
  }

  private async callLite(url: string) {
    const { spawn } = await import('child_process')
    return new Promise((resolve) => {
      const p = spawn('npx', ['tsx', 'src/crawler-lite.ts', '--url', url, '--max', '3', '--out', 'D:\\opencode-cache\\mcp\\brain-lite.json'], { cwd: 'D:\\opencode-projects\\mad-dog-crawler', shell: true })
      let out = ''
      p.stdout.on('data', (d) => out += d.toString())
      p.on('close', () => resolve({ tool: 'lite', output: out.slice(0, 500) }))
    })
  }

  private async callTurbo(url: string) {
    const { spawn } = await import('child_process')
    return new Promise((resolve) => {
      const p = spawn('npx', ['tsx', 'src/crawler-turbo.ts', '--url', url, '--max', '5', '--concurrency', '10', '--out', 'D:\\opencode-cache\\mcp\\brain-turbo.json'], { cwd: 'D:\\opencode-projects\\mad-dog-crawler', shell: true })
      let out = ''
      p.stdout.on('data', (d) => out += d.toString())
      p.on('close', () => resolve({ tool: 'turbo', output: out.slice(0, 500) }))
    })
  }

  private async callVision(url: string) {
    const { spawn } = await import('child_process')
    return new Promise((resolve) => {
      const p = spawn('npx', ['tsx', 'src/crawler-vision.ts', '--url', url, '--scroll', '2', '--out', 'D:\\opencode-cache\\mcp\\brain-vision.json'], { cwd: 'D:\\opencode-projects\\mad-dog-crawler', shell: true })
      let out = ''
      p.stdout.on('data', (d) => out += d.toString())
      p.on('close', () => resolve({ tool: 'vision', output: out.slice(0, 500) }))
    })
  }

  private async callApiFinder(url: string) {
    const { spawn } = await import('child_process')
    return new Promise((resolve) => {
      const p = spawn('npx', ['tsx', 'src/crawler-api-finder.ts', '--url', url, '--max', '5', '--out', 'D:\\opencode-cache\\mcp\\brain-apis.json'], { cwd: 'D:\\opencode-projects\\mad-dog-crawler', shell: true })
      let out = ''
      p.stdout.on('data', (d) => out += d.toString())
      p.on('close', () => resolve({ tool: 'api-finder', output: out.slice(0, 500) }))
    })
  }

  private async callAutoAuth(url: string) {
    const { spawn } = await import('child_process')
    return new Promise((resolve) => {
      const p = spawn('npx', ['tsx', 'src/crawler-auto-auth.ts', '--url', url, '--public'], { cwd: 'D:\\opencode-projects\\mad-dog-crawler', shell: true })
      let out = ''
      p.stdout.on('data', (d) => out += d.toString())
      p.on('close', () => resolve({ tool: 'auto-auth', output: out.slice(0, 500) }))
    })
  }

  private remember(plan: Plan) {
    this.memory.lastRequest = plan.params.request
    this.memory.lastPlan = plan
    this.memory.count = (this.memory.count || 0) + 1
    fs.mkdirSync(path.dirname(this.memoryPath), { recursive: true })
    fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2), 'utf-8')
    return { remembered: true, memory: this.memory }
  }

  private save(results: any) {
    const out = 'D:\\opencode-cache\\mcp\\brain-result.json'
    fs.writeFileSync(out, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`💾 Brain result: ${out}`)
  }
}
