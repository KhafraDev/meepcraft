const fetch = require('node-fetch');
const cheerio = require('cheerio');
const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "you thought",
    database: "meepcraft"
});

con.connect(function(err) {
    if (err) return;
});

module.exports.user = async function(user) {
    return new Promise(function(resolve, reject) {
        con.query(`SELECT * FROM users WHERE name='${user}'`, function (err, result, fields) {
            if(err) return reject(err);
            if(!result[0]) return reject("No member found.");
            if(result[0] && result[0].name && result[0].id) {
                let followers = 0, following = 0, LA = "", joined = "", messages = "", likes = "", trophy = "";

                fetch(`http://meepcraft.com/members/.${result[0].id}`)
                    .then(res => res.text())
                    .then(async body => {
                        let $ = cheerio.load(body);
                        $('span[class=DateTime]').remove();

                        $('div[class="secondaryContent pairsJustified"] dl').each(function(index, element) {
                            let type = $(this).text().trim().replace(/\t/g, "").split("\n");
                            switch(type[0]) {
                                case "Last Activity:": LA = type[1]; break;
                                case "Joined:": joined = type[1]; break;
                                case "Messages:": messages = type[1]; break;
                                case "Likes Received:": likes = type[1]; break;
                                case "Trophy Points:": trophy = type[1]; break;
                                default: break;
                            }
                        });

                        $('div[class="followBlocks"]').find('h3').each(function(index, element) {
                            let arr = $(this).text().trim().replace(/\t/g, "").split("\n");
                            switch(arr[0]) {
                                case "Following": following = arr[1]; break;
                                case "Followers": followers = arr[1]; break;
                                default: break;
                            }
                        })

                        let title = $('p[class="userBlurb"]').text().trim();
                        let gender = $('dd[itemprop="gender"]').text();
                        let birthday = $('span[class="dob"]').text();
                        let age = $('span[class="age"]').text().replace(/\D/g, "");
                        let status = $('p[id="UserStatus"]').text();
                       
                        gender = gender == "" ? "N/A" : gender;
                        birthday = birthday == "" ? "N/A" : birthday;
                        age = age == "" ? "N/A" : age;
                        status = status == "" ? "N/A" : status;

                        return resolve({ id: result[0].id, title: title, lastActivity: LA, joined: joined, messages: messages, likes: likes, trophyPoints: trophy, gender: gender, birthday: birthday, age: age, following: following, followers: followers, status: status })
                    })
            }
        });
    })
}

module.exports.posts = function(url) {
    return new Promise(function(resolve, reject) {
        if(url.indexOf('http://') !== 0 && url.indexOf('https://') !== -1) return reject("**Error:** MeepCraft doesn't support TLS!")
        try { 
            url = new URL(url); 
            if(url.protocol !== "http:" && url.host !== "meepcraft.com" && url.origin !== "http://meepcraft.com") return reject("**Error:** Invalid URL (host, origin)!") 

            fetch(url)
                .then(res => res.text())
                .then(async body => {
                    let $ = cheerio.load(body);
                    $('aside').remove();

                    let opauthor = $('ol[class="messageList"]').find('li').attr('data-author').valueOf();
                    let op = $('ol[class="messageList"]').find('li').find('blockquote').first().text().trim().replace(/\t/g, "").substr(0, 497) + "...";

                    let found = `*${opauthor}*\n\`\`\`${op}\`\`\`\n`;

                    $('ol[class="messageList"]').find('li').next().each(function(index, element) { 
                        let text = $(this).find('blockquote').first().text().trim().replace(/\n/g, " ");
                        let date = $(this).find('span[class="DateTime"]').text();
                        if(text.length > 0) {
                            let author = $(this).attr('data-author').valueOf();
                            found += `*${author}* on ${date}\n\`\`${text.substr(0, 40)}...\`\`\n`;
                        }
                    });

                    return resolve(found);
                })
        } catch(e) { 
            return reject(e) 
        }
    })
}

module.exports.recent = function() {
    return new Promise(function(resolve, reject) {
        fetch("http://meepcraft.com/")
            .then(res => res.text())
            .then(async body => {
                let $ = cheerio.load(body);
                let desc = "";

                $('div[class="sidebar"]').find('ol[class="discussionListItems"]').find('li').each(function(index, element) {
                    let poster = $(this).find('div[class="muted"]').find('a').first().text()
                    let title = $(this).find('div[class="title"]').text().trim()
                    let link = `http://meepcraft.com/${$(this).find('div[class="title"]').find('a').attr('data-previewurl').valueOf()}`
                    link = link.endsWith('/preview') ? link.substr(0, link.length - 7) : link;

                    let avatarURL = `http://meepcraft.com/${$(this).find('a').find('img').attr('src').valueOf()}`;
                    let date = $(this).find('div[class="muted"]').find('abbr').text();
                    
                    desc += `${poster} @ ${date}\n**${title}**\n\`\`${link}\`\`\n\n`;
                })

                return resolve(desc)
            })
    })
}

module.exports.stats = function() {
    return new Promise(function(resolve, reject) {
        fetch("http://meepcraft.com/")
            .then(res => res.text())
            .then(async body => {
                let $ = cheerio.load(body);
                $('dt').remove()

                let stats = $('div[id="boardStats"]');
                let threads = stats.find('dl[class="discussionCount"]').text().trim();
                let messages = stats.find('dl[class="messageCount"]').text().trim();
                let members = stats.find('dl[class="memberCount"]').text().trim();
                let record = stats.find('dd[class="Tooltip"]').text().trim();

                let latest = stats.find('a').text();
                let latestURL = `http://meepcraft.com/${stats.find('a').attr('href').valueOf()}`;
                
                return resolve({ threads: threads, messages: messages, members: members, recordMembers: record, latestMember: latest, latestMemberURL: latestURL});
            })
    })
}

module.exports.online = function() {
    return new Promise(function(resolve, reject) {
        fetch("http://meepcraft.com/")
            .then(res => res.text())
            .then(async body => {
                let $ = cheerio.load(body);
                
                let members = "";
                $('div[class="section membersOnline userList"]').find('ol[class="listInline"]').find('li').each(function(index, element) {
                    members += $(this).text().trim();
                })

                let footer = $('div[class="section membersOnline userList"]').find('div[class="footnote"]').text().trim().split(/\D/g).filter(Boolean)

                return resolve({ members: members.replace(/,/g, ", "), footer: footer})
            })
    })
}

setInterval(() => {
    con.query("SELECT 1");
}, 60000);