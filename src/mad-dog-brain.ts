#!/usr/bin/env node
/**
 * MAD DOG BRAIN - One Intelligence, One Request
 * D:\opencode-projects\mad-dog-crawler\src\mad-dog-brain.ts
 * 
 * Usage: npx tsx src/mad-dog-brain.ts --task "crawl https://reqres.in and bring APIs with vision"
 * The brain automatically calls needed tools: lite, turbo, vision, api-finder, auto-auth, memory
 */

import { Command } from 'commander'
import { MadDogBrain } from './brain/index.js'

const program = new Command()
program
  .option('--task <task>', 'One request - brain auto-calls tools', 'crawl https://example.com')
  .action(async (o) => {
    const brain = new MadDogBrain()
    const plan = brain.think(o.task)
    const results = await brain.execute(plan)
    console.log(`\n🧠 Final results keys: ${Object.keys(results).join(', ')}`)
  })

program.parse()
