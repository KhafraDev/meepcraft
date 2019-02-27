const fetch = require('node-fetch');
const cheerio = require('cheerio');
const mysql = require('mysql');

// slow down the amount of requests that can be made per second
const throttledQueue = require('throttled-queue');
const throttle = throttledQueue(3, 1000);

const con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'lol',
	database: 'meepcraft',
});

for (let i = 1; i <= 42734; i++) {
	throttle(function() {
		fetch(`http://meepcraft.com/members/.${i}`)
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);
				const name = $('h1[class="username"]').text().replace(/[&/\\#,+()$~%.`'":*?<>{}]/g, '\\$&');

				if (name !== '' && typeof con !== 'undefined') {
					con.query(`INSERT INTO users (name, id) VALUES ("${name}", "${i}")`, function(err) {
						if (err) throw err;
					});
				}
			});
	});
}
