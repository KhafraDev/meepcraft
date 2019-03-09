const fetch = require('node-fetch');
const cheerio = require('cheerio');
const m = require('./meep/meep-recent-user');

m(2)
    .then(r => {
        console.log(r.posts)
    })