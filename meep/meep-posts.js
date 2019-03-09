const fetch = require('node-fetch');
const cheerio = require('cheerio');
const validator = require('validator');

module.exports = (link) => {
	return new Promise((resolve, reject) => {
		link = isNaN(link) ? link : `http://meepcraft.com/threads/.${link}`;
		if(!validator.isURL(link, { protocols:['http'], require_protocol: true, host_whitelist:['meepcraft.com'] }) || !link.match(/\/threads\/(.*?)\./g)) {
			return reject(new Error(`The link provided is not valid!`));
		}

		fetch(link)
			.then(res => res.text())
			.then(body => {
				const $ = cheerio.load(body);

                if ($('label[class="OverlayCloser"]').text() == 'The requested thread could not be found.') 
                    return reject(new Error('The thread has been removed/deleted.'));

				const opPost = $('ol[id="messageList"]').find('li').first().find('div[class="messageContent"]').text().trim();
				const opAuthor = $('ol[id="messageList"]').find('li').first().find('h3[class="userText"]').find('a').text();
				const postedIn = $('p[id="pageDescription"]').find('a').first().text();
				const timePosted = $('p[id="pageDescription"]').find('span[class=DateTime]').attr('title');
				const postTitle = $('div[class="titleBar"]').find('h1').text();

				return resolve({ text: opPost, author: opAuthor, forum: postedIn, date: typeof timePosted !== 'undefined' ? timePosted : 'N/A', title: postTitle, url: link });
			}).catch((err) => {
				return reject(err);
			});
	});
};