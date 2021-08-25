# couch-replication-target

A simple Node.js app that pretends to be a CouchDB replication target. It listens on port 8080 and will accept incoming replications, writing all incoming data to disk using the following structure

```
CWD/<dbname>/local/... // checkpoints go here
CWD/<dbname>/docs/...  // bulk inserts go here
```

## Installation

Clone this repo then:

```sh
npm install
npm run start
```

## Replication

In CouchDB, set up a replication with a valid CouchDB source and `http://localhost:8080/dbname` as the target, where `dbname` is the folder in which the data will be stored. This project implements enough of the CouchDB replication protocol to fool CouchDB into thinking it's speaking to another CouchDB.

