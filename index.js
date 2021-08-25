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
const PORT = 8080
const HOST = '0.0.0.0' // listen on all network interfaces

// the express app with:
// - the HTTP body parsing middleware to handling POSTed HTTP bodies
const app = express()
app.use(bodyParser.json({ limit: '50MB' }))
app.use(morgan('combined'))

const makeDirectory = (db) => {
  try {
    fs.mkdirSync(path.join(CWD, db))
    fs.mkdirSync(path.join(CWD, db, 'local'))
    fs.mkdirSync(path.join(CWD, db, 'docs'))
  } catch {
  }
}

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

app.get('/', async (req, res) => {
  res.send({
    couchdb: 'Welcome',
    version: '3.1.1'
  })
})

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

app.post('/:db/_revs_diff', async (req, res) => {
  const body = req.body
  const retval = {}
  for (const k in body) {
    const v = body[k]
    retval[k] = { missing: v, possible_ancestors: [] }
  }
  res.send(retval)
})

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
  const p = path.join(CWD, db, 'docs', ts + '.json')
  fs.writeFileSync(p, JSON.stringify(body))
  res.status(201).send(retval)
})

app.post('/:db/_ensure_full_commit', async (req, res) => {
  const retval = {
    ok: true,
    instance_start_time: '0'
  }
  res.status(201).send(retval)
})

/*
app.post('/flush', async (req, res) => {
  await redisFlush()
  console.log('cache is flushed!')
  res.send({ ok: true })
}),

// respond to POST requests to the /team endpoint
app.post('/team', async (req, res) => {
  // extract the chosen team from the POSted body
  const team = req.body.team
  console.log(team)
  console.log(req.body)
  let retval
  let cache = false

  // first check the cache
  retval = await redisGet(team)
  if (retval) {
    console.log('Got from cache')
    retval = JSON.parse(retval)
    cache = true
  } else {
    //  retrieve from Cloudant using a MapReduce view
    console.log('fetching from Cloudant')
    retval = await client.postView({
      db: DBNAME,
      ddoc: DESIGN_DOC,
      view: 'test',
      key: team,
      includeDocs: true,
      reduce: false,
      limit: 10
    })
    // save to the cache
    await redisSet(team, 60, JSON.stringify(retval))
  }
  console.log('size:', retval.result.rows.length)
  res.send({
 data: retval,
    cache: cache
 })
})
*/

app.use(async (req, res) => {
  res.status(404).send({})
})

// start the webserver
app.listen(PORT, HOST)
console.log(`Running on http://${HOST}:${PORT}`)
