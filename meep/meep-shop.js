const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = () => {
	return new Promise(resolve => {
		fetch('http://shop.meepcraft.com/')
            .then((res) => res.text())
            .then(async (body) => {
                const $ = cheerio.load(body);

                const top_ign = $('div[class="top-donator"]').find('div[class="ign"]').text().length > 0 ? `\`\`${$('div[class="top-donator"]').find('div[class="ign"]').text().trim()}\`\`` : '\`\`No recent top donator to display.\`\`';
                const top_amount = $('div[class="top-donator"]').find('div[class="amount"]').text().replace(/month.|[^0-9.]/g, '').length > 0 ? `\`\`${$('div[class="top-donator"]').find('div[class="amount"]').text().replace(/month.|[^0-9.]/g, '')}\`\`` : '\`\`No recent top donator to display.\`\`'

                let pay = $('ul[class="payments"] li').map((index, element) => {
                    const name = $(element).find('div[class="ign"]').text().trim();
                    const product = $(element).find('div[class="extra"]').text().trim().replace(/\s\s/g, '').replace('• ', '• $');
                    return { name: name, rank: product };
                }).get();
                
                return resolve({ top: top_ign === top_amount ? 'No recent top donator to display.' : { amount: top_amount, ign: top_ign }, payments: pay });
            })
	});
};