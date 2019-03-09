const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = (uid) => {
	return new Promise((resolve, reject) => {
		fetch(`http://meepcraft.com/members/.${uid}/recent-content`)
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);

                let posts = $('ol').eq(1).find('li').map((index, element) => {
                    const postType = $(element).find('div[class="titleText"]').find('span[class="contentType"]').html();
                    const postTitle = $(element).find('div[class="titleText"]').find('a').text();
                    const link = $(element).find('div[class="titleText"]').find('a').attr('href').valueOf();
                    const date = $(element).find('span[class="DateTime"]').text() == '' ? $(element).find('abbr[class="DateTime"]').text() : $(element).find('span[class="DateTime"]').text();
                    
                    return { type: postType, title: postTitle, url: link, date: date };
                }).get();

                return resolve({ posts: posts });
			}).catch((err) => {
				return reject(err);
			});
	});
};