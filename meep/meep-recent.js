const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = () => {
	return new Promise(resolve => {
		fetch('http://meepcraft.com/')
			.then((res) => res.text())
			.then(async (body) => {
                const $ = cheerio.load(body);
                
				let desc = $('div[class="sidebar"]').find('ol[class="discussionListItems"]').find('li').map((index, element) => {
                    const poster = $(element).find('div[class="muted"]').find('a').first().text();
                    const title = $(element).find('div[class="title"]').text().trim();
                    const link = `http://meepcraft.com/${$(element).find('div[class="title"]').find('a').attr('data-previewurl').valueOf()}`.replace('/preview', '');
                    const date = $(element).find('div[class="muted"]').find('abbr').text();
        
                    return { author: poster, title: title, url: link, date: date };
                }).get();

				return resolve(desc);
			});
	});
};