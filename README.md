# couch-replication-target

A simple Node.js app that pretends to be a CouchDB replication target. It listens on port 8080 and will accept incoming replications, writing all incoming data to disk using the following structure

```
CWD/<dbname>/local/... // checkpoints go here
CWD/<dbname>/docs/...  // bulk inserts go here
```

Each of the files in the `docs` folder contains an array of documents that were written in bulk by the replicator.

## Installation

Clone this repo then:

```sh
npm install
npm run start
```

## Configuration

Environment variables can be used to configure the app's runtime behaviour:

- `PORT` - the port on which the app will listen. Default `8080`
- `AUTH_USERNAME` - the username used to authenticate incoming requests. Default `undefined`
- `AUTH_PASSWORD` - the password used to authenticate incoming requests. Default `undefined`

> Both `AUTH_USERNAME` & `AUTH_PASSWORD` must be supplied to enable basic authentication.

## Replication

In CouchDB, set up a replication with a valid CouchDB source and `http://localhost:8080/dbname` as the target, where `dbname` is the folder in which the data will be stored. This project implements enough of the CouchDB replication protocol to fool CouchDB into thinking it's speaking to another CouchDB.

