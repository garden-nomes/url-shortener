const express = require('express');
const mongoClient = require('mongodb').MongoClient;

const config = require('./config');

const app = express();

const URLS = 'urls';
const URL_EXP = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

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
  if (url && URL_EXP.test(url)) {
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
    error(res, null, 'invalid url', 400);
  }
});

app.get('/:key', (req, res) => {
  const { key } = req.params;
  retrieveUrl(key, (err, url) => {
    if (err) {
      error(res, err, 'unable to retreive url');
    } else {
      if (url) {
        res.redirect(url);
      } else {
        error(res, null, 'invalid key', 400);
      }
    }
  });
});

/* Helpers */

function error(res, err, message, code = 500) {
  if (err) {
    console.log(JSON.stringify(err));
  }

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
                     .next((err, result) => {
    if (err) {
      return cb(err);
    } else {
      return cb(null, result ? result.url : null);
    }
  });
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
