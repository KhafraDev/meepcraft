const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = () => {
	return new Promise((resolve, reject) => {
		fetch('http://meepcraft.com/')
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);

				let members = $('div[class="section membersOnline userList"]').find('ol[class="listInline"]').find('li').map((index, element) => {
					return $(element).text().trim();
				}).get().join(' ');

				const footer = $('div[class="section membersOnline userList"]').find('div[class="footnote"]').text().trim().split(/\D/g).filter(Boolean);

				return resolve({ members: members, footer: footer });
			})
			.catch(err => {
				return reject({ error: err });
			})
	});
};