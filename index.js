// express webserver https://www.npmjs.com/package/express
// & HTTP body parsing middleware https://www.npmjs.com/package/body-parser
// & Morgan - a logging package
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const fs = require('fs')
const path = require('path')
const CWD = process.cwd()

// constants
const LOCAL = 'local'
const DOCS = 'docs'
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080
const HOST = '0.0.0.0' // listen on all network interfaces

// the express app with:
// - the HTTP body parsing middleware to handling POSTed HTTP bodies
const app = express()
app.use(bodyParser.json({ limit: '50MB' }))
app.use(morgan('combined'))

// make local database structure
const makeDirectory = (db) => {
  try {
    fs.mkdirSync(path.join(CWD, db))
    fs.mkdirSync(path.join(CWD, db, LOCAL))
    fs.mkdirSync(path.join(CWD, db, DOCS))
  } catch {
  }
}

// PUT /db/_local/id - put local checkpoint
app.put('/:db/_local/:id', async (req, res) => {
  const db = req.params.db
  const id = req.params.id
  const body = req.body
  fs.writeFileSync(path.join(CWD, db, 'local', id + '.json'), JSON.stringify(body))
  const retval = {
    ok: true,
    id: id,
    rev: '0-1'
  }
  res.status(201).send(retval)
})

// GET /db/_local/id - get local checkpoint
app.get('/:db/_local/:id', async (req, res) => {
  const db = req.params.db
  const id = req.params.id
  const p = path.join(CWD, db, 'local', id + '.json')
  if (fs.existsSync(p)) {
    const body = JSON.parse(fs.readFileSync(p, { encoding: 'utf8' }))
    res.send(body)
  } else {
    res.status(404).send({
      error: 'not_found',
      reason: 'missing'
    })
  }
})

// GET / - get top-level "are you there?"
app.get('/', async (req, res) => {
  res.send({
    couchdb: 'Welcome',
    version: '3.1.1'
  })
})

// GET /db - get gb meta data
app.get('/:db', async (req, res) => {
  const db = req.params.db
  makeDirectory(db)
  res.send({
    update_seq: '0-1',
    db_name: db,
    purge_seq: 0,
    sizes: {
      file: 0,
      external: 0,
      active: 0
    },
    props: {},
    doc_del_count: 0,
    doc_count: 0,
    disk_format_version: 8,
    compact_running: false,
    cluster: {
      q: 1,
      n: 1,
      w: 1,
      r: 1
    },
    instance_start_time: '0'
  })
})

// POST /db/_revs_diff - yes we need those changes
app.post('/:db/_revs_diff', async (req, res) => {
  const body = req.body
  const retval = {}
  for (const k in body) {
    const v = body[k]
    retval[k] = { missing: v, possible_ancestors: [] }
  }
  res.send(retval)
})

// POST /db/_bulk_docs - receive bulk writes
app.post('/:db/_bulk_docs', async (req, res) => {
  const db = req.params.db
  const body = req.body
  const retval = []

  for (const k in body.docs) {
    const doc = body.docs[k]
    const obj = {
      ok: true,
      id: doc._id,
      rev: doc._rev
    }
    retval.push(obj)
  }
  makeDirectory(db)
  const ts = new Date().getTime()
  const p = path.join(CWD, db, DOCS, ts + '.json')
  fs.writeFileSync(p, JSON.stringify(body))
  res.status(201).send(retval)
})

// POST /db/_ensure_full_commit - NOP
app.post('/:db/_ensure_full_commit', async (req, res) => {
  const retval = {
    ok: true,
    instance_start_time: '0'
  }
  res.status(201).send(retval)
})

// 404 everything else
app.use(async (req, res) => {
  res.status(404).send({})
})

// start the webserver
app.listen(PORT, HOST)
console.log(`Running on http://${HOST}:${PORT}`)
