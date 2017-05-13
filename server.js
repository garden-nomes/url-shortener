const express = require('express');
const mongoClient = require('mongodb').MongoClient;
const URI = require('urijs');

const config = require('./config');

const app = express();

const URLS = 'urls';

/* Database/server startup */

let db;
mongoClient.connect(config.MONGODB_URI, (err, _db) => { if (err) {
    console.error(err);
    process.exit(1);
  }

  db = _db;
  console.log('* Database connected at ' + config.MONGODB_URI + '...');

  app.listen(config.PORT, () => {
    console.log('* Server up and running on port ' + config.PORT + '...');
  });
});

/* Routes */

app.get('/new', (req, res) => {
  const url = req.query.url;
  if (url && URI(url).hostname()) {
    insertUrl(url, (err, key) => {
      if (err) {
        error(res, err, 'unable to store url');
      } else {
        console.log(JSON.stringify({ url, key }));
        res.status(200).send({
          original: url,
          short: config.BASE_URL + key
        });
      }
    });
  } else {
    res.status(400).send({ error: 'invalid url' });
  }
});

app.get('/:key', (req, res) => {
  const { key } = req.params;
  retrieveUrl(key, (err, url) => {
    if (err) {
      error(res, err, 'unable to retreive url');
    } else {
      res.redirect(url);
    }
  });
});

/* Helpers */

function error(res, err, message, code = 500) {
  console.log(JSON.stringify(err));
  res.status(code).send({ error: { code, message }});
}

/**
 * Generates a key stores the url and key in the database.
 *
 * @param {String} url
 * @param {insertUrlCallback} cb
 */
function insertUrl(url, cb) {
  const key = generateKey();
  db.collection(URLS).insertOne({ key, url }, (err) => {
    return err ? cb(err) : cb(null, key);
  });
}

/**
 * @callback insertUrlCallback
 * @param {Error} error
 * @param {String} key
 */

/**
 * Retreives the url associated with a key
 * @param {String} key
 * @param {retrieveUrlCallback} cb
 */
function retrieveUrl(key, cb) {
  db.collection(URLS).find({ key }, { fields: { url: 1 }})
                     .limit(1)
                     .next((err, result) => (
                       err ? cb(err) : cb(null, result.url)
                     ));
}

/**
 * @callback retreiveUrlCallback
 * @param {Error} error
 * @param {String} url
 */

function generateKey() {
  const charset = 'abcdefghijklmnopqrstuvwxyz' +
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                  '1234567890';

  return new Array(config.KEY_LEN).fill(0).map(() => (
    charset[(Math.random() * charset.length)|0]
  )).join('');
}
