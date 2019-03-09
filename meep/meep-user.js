const fetch = require('node-fetch');
const cheerio = require('cheerio');

//https://stackoverflow.com/a/17008027
//https://thecodebarbarian.com/80-20-guide-to-express-error-handling

module.exports = (user) => {
    return new Promise((resolve, reject) => {
        fetch(`http://meepcraft.com/members/.${user}`)
            .then((r) => r.text())
            .then(async (body) => {
                const $ = cheerio.load(body);
                $('span[class=DateTime]').remove();
                if($('label[class="OverlayCloser"]').text() == "This user's profile is not available.") return reject(new Error(`This user's profile is not available.`));

                let blurb = $('div[class="secondaryContent pairsJustified"] dl').map((index, element) => {
                    const type = $(element).text().trim().replace(/\t/g, '').split('\n');
                    return { type: type[0], value: type[1] ? type[1] : 'N/A (Last Activity broken atm)' };
                }).get();
        
                let followBlock = $('div[class="followBlocks"]').find('h3').map((index, element) => {
                    const arr = $(element).text().trim().replace(/\t/g, '').split('\n');
                    return { type: `${arr[0]}:`, value: arr[1] };
                }).get();

                const title = $('p[class="userBlurb"]').text().trim();
                const status = $('p[id="UserStatus"]').text().length > 0 ? $('p[id="UserStatus"]').text().trim() : null;
                const bd = $('span[class="dob"]').text().length > 0 ? $('span[class="dob"]').text() : null;

                return resolve({ id: user, title: title, status: status, birthday: bd, blurb: blurb, followBlock: followBlock });
            });
    });
}