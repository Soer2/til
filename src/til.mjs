import * as child_process from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as url from 'url'
import * as util from 'util'

const TIL_PATH = path.dirname(url.fileURLToPath(import.meta.url))
const ENTRIES = path.resolve(TIL_PATH, '../entries')

const TAGS = ['vim']

export async function main(argv) {
  console.log('making sure til is up to date...')
  if (await exec(`git -C "${TIL_PATH}" status --porcelain`)) {
    console.error("til repo is unclean")
    return process.exit(1)
  }
  await exec(`git -C "${TIL_PATH}" pull`, { timeout: 2000 }).catch(console.error)

  const filename = path.resolve(
    ENTRIES, 
    argv.length > 2
      ? path.resolve(ENTRIES, argv.slice(2).join(' ').replace(/[\/:]/g, '-') + '.md')
      : (await interactive(`ls | fzf --no-multi --layout=reverse --margin 7% --border=none --preview "bat --color=always --style=plain --line-range=:500 {}" --preview-window=right,70%,border-none`, { cwd: ENTRIES })).trim()
  )

  const fileExists = await exists(filename)
  if (fileExists) {
    await edit(`+8 "${quot(filename)}"`)
  } else {
    const title = argv.slice(2).join(' ')
    const permalink = title.replace(/[^0-9a-z]/gi, '-')
    const date = now()
    const tags = argv.slice(2).map(arg => arg.toLowerCase()).filter(arg => TAGS.includes(arg))
    const entry = template({ title, permalink, date, tags })
    await fs.writeFile(filename, entry, 'utf8')
    await edit(`+8 +star "${quot(filename)}"`)
  }

  await exec(`git -C "${TIL_PATH}" add "${quot(filename)}" && git commit -m "${fileExists ? 'edit' : 'add'}: ${quot(filename)}" && git push || echo "Not committing"`)
}

const quot = str => str.replace(/\"/g, '\\"')

const exec = async (...args) => {
  const result = await util.promisify(child_process.exec)(...args)
  if (result.stderr) console.error(result.stderr)
  return result.stdout
}

const edit = (command) => new Promise((resolve, reject) => {
  const shell = child_process.spawn(`$EDITOR ${command}`, { stdio: "inherit", shell: true })
  shell.on('close', code => code ? reject() : resolve())
  shell.on('error', error => reject(error))
})

const interactive = (command, opts) => new Promise((resolve, reject) => {
  const shell = child_process.spawn(command, { stdio: [0, null, 2], shell: true, ...opts })
  let results = ''
  shell.stdout.on('data', data => {
    results += data
  })
  shell.on('close', code => code ? reject() : resolve(results))
  shell.on('error', error => reject(error))
})

const exists = p => fs.stat(p).then(
  () => true,
  error => { if (error.code === 'ENOENT') return false; throw error }
)

function now() {
  const date = new Date()
  const p4 = n => (n < 0 ? '-' : '+') + String(Math.abs(n)).padStart(4, '0')
  const p2 = n => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const mo = p2(date.getMonth() + 1)
  const d = p2(date.getDate())
  const h = p2(date.getHours())
  const mi = p2(date.getMinutes())
  const s = p2(date.getSeconds())
  const tz = p4(date.getTimezoneOffset())
  return `${y}/${mo}/${d} ${h}:${mi}:${s} ${tz}`
}

const template = ({ title, permalink, date, tags }) =>
`---
title: ${title}
permalink: ${permalink}
date: ${date}
tags: [${tags.join()}]
---


`
