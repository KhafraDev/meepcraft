const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = (link) => {
	return new Promise((resolve, reject) => {
		if(isNaN(parseInt(link))) {
            return reject('ID isNaN');
        } 

		fetch(`http://meepcraft.com/threads/.${parseInt(link)}`)
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);
				$('aside').remove();
				$('span[class="doublePostTagText"]').remove();

                if ($('label[class="OverlayCloser"]').text() == 'The requested thread could not be found.') 
                    return reject(new Error('**Error:** the thread has been removed/deleted.'));

				let comments = $('ol[class="messageList"]').find('li').next().map((index, element) => {
					const text = $(element).find('blockquote').first().text().trim().replace(/\s\s+/g, ' ');
					const date = $(element).find('span[class="DateTime"]').first().text().length > 0 ?  $(element).find('span[class="DateTime"]').first().text() : $(element).find('abbr[class="DateTime"]').first().text();
					const author = $(element).attr('data-author').valueOf().trim();
                    
                    return { cText: text, cDate: date, cAuthor: author };
				}).get();
				return resolve(comments);
			});
	});
};