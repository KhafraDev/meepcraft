const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = () => {
	return new Promise((resolve, reject) => {
		fetch('http://meepcraft.com/')
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);
				$('dt').remove();

				const stats = $('div[id="boardStats"]');
				const threads = stats.find('dl[class="discussionCount"]').text().trim();
				const messages = stats.find('dl[class="messageCount"]').text().trim();
				const members = stats.find('dl[class="memberCount"]').text().trim();
				const record = stats.find('dd[class="Tooltip"]').text().trim();

				const latest = stats.find('a').text();
				const latestURL = `http://meepcraft.com/${stats.find('a').attr('href').valueOf()}`;

				return resolve({ threads: threads, messages: messages, members: members, recordMembers: record, latestMember: latest, latestMemberURL: latestURL });
			}).catch(err => {
				return reject({ error: err });
			})
	});
};