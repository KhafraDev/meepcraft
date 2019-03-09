const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = () => {
	return new Promise((resolve, reject) => {
		fetch('http://meepcraft.com/members/?type=staff')
			.then((res) => res.text())
			.then(body => {
				const $ = cheerio.load(body);

				let staff = $('div[class="titleGroup"]').map((index, element) => {
					const position = $(element).text();
					let names = $(element).next().find('li[class="primaryContent memberListItem"]').map((i, e) => {
						return {pos: position, name: $(e).find('div[class="member"]').find('h3[class="username"]').text().trim()};
					}).get()
					return names;
				}).get();

				return resolve(staff);
            })
            .catch(err => {
                return reject({ error: err });
            })
	})
}