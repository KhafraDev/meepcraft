const fetch = require('node-fetch');
const cheerio = require('cheerio');
const mysql = require('mysql');
const validator = require('validator');

const con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'lol',
	database: 'meepcraft',
});

con.connect(err => {
	if (err) throw err;
});

exports.userProfileLink = (name) => {
	return new Promise(function(resolve, reject) {
		con.query(`SELECT * FROM users WHERE name='${name}'`, function(err, result) {
			if (err) return reject(err);
			if (!result[0]) return reject(new Error('**Error:** no member found!'));

			return resolve({ link: `http://meepcraft.com/members/.${result[0].id}`, id: result[0].id });
		});
	});
};

exports.user = (user) => {
	return new Promise((resolve, reject) => {
		let followers = 0;
		let following = 0;
		let LA = '';
		let joined = '';
		let messages = '';
		let likes = '';
		let trophy = '';

		fetch(user.link)
			.then((r) => r.text())
			.then(async (body) => {
				const $ = cheerio.load(body);

				$('span[class=DateTime]').remove();
				if($('label[class="OverlayCloser"]').text() == "This user's profile is not available.") return reject(new Error(`This user's profile is not available.`));
				$('div[class="secondaryContent pairsJustified"] dl').each((index, element) => {
					const type = $(element).text().trim().replace(/\t/g, '').split('\n');
					switch (type[0]) {
					case 'Last Activity:': LA = type[1]; break;
					case 'Joined:': joined = type[1]; break;
					case 'Messages:': messages = type[1]; break;
					case 'Likes Received:': likes = type[1]; break;
					case 'Trophy Points:': trophy = type[1]; break;
					default: break;
					}
				});

				$('div[class="followBlocks"]').find('h3').each((index, element) => {
					const arr = $(element).text().trim().replace(/\t/g, '').split('\n');
					switch (arr[0]) {
					case 'Following': following = arr[1]; break;
					case 'Followers': followers = arr[1]; break;
					default: break;
					}
				});

				const title = $('p[class="userBlurb"]').text().trim();
				let gender = $('dd[itemprop="gender"]').text();
				let birthday = $('span[class="dob"]').text();
				let age = $('span[class="age"]').text().replace(/\D/g, '');
				let status = $('p[id="UserStatus"]').text();

				gender = gender == '' ? 'N/A' : gender;
				birthday = birthday == '' ? 'N/A' : birthday;
				age = age == '' ? 'N/A' : age;
				status = status == '' ? 'N/A' : status;
				LA = typeof LA == 'undefined' ? 'N/A' : LA;

				return resolve({ id: user.id, title: title, lastActivity: LA, joined: joined, messages: messages, likes: likes, trophyPoints: trophy, gender: gender, birthday: birthday, age: age, following: following, followers: followers, status: status });
			});
	});
};

exports.recent = () => {
	return new Promise(resolve => {
		fetch('http://meepcraft.com/')
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);
				let desc = '';

				$('div[class="sidebar"]').find('ol[class="discussionListItems"]').find('li').each((index, element) => {
					const poster = $(element).find('div[class="muted"]').find('a').first().text();
					const title = $(element).find('div[class="title"]').text().trim();
					let link = `http://meepcraft.com/${$(element).find('div[class="title"]').find('a').attr('data-previewurl').valueOf()}`;
					link = link.endsWith('/preview') ? link.substr(0, link.length - 7) : link;

					const date = $(element).find('div[class="muted"]').find('abbr').text();

					desc += `${poster} @ ${date}\n[**${title}**](${link})\n`;
				});

				return resolve(desc);
			});
	});
};

exports.stats = () => {
	return new Promise(resolve => {
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
			});
	});
};

exports.online = () => {
	return new Promise(resolve => {
		fetch('http://meepcraft.com/')
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);

				let members = '';
				$('div[class="section membersOnline userList"]').find('ol[class="listInline"]').find('li').each((index, element) => {
					members += $(element).text().trim();
				});

				const footer = $('div[class="section membersOnline userList"]').find('div[class="footnote"]').text().trim().split(/\D/g).filter(Boolean);

				return resolve({ members: members.replace(/,/g, ', '), footer: footer });
			});
	});
};

exports.players = () => {
	return new Promise(resolve => {
		fetch('http://meepcraft.com/game/query.php')
			.then((res) => res.json())
			.then(body => {
				return resolve(body);
			});
	});
};

exports.shop = () => {
	return new Promise(resolve => {
		fetch('http://shop.meepcraft.com/')
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);

				const top = $('div[class="top-donator"]');

				const top_ign = top.find('div[class="ign"]').text();
				const top_amount = top.find('div[class="amount"]').text().replace(/month.|[^0-9.]/g, '');
				const top_avatarURL = top.find('div[class="avatar"] img').attr('src').valueOf() + '.png';

				let desc = '';
				$('ul[class="payments"] li').each((index, element) => {
					const ign = $(element).find('div[class="ign"]').text().trim();
					const product = $(element).find('div[class="extra"]').text().trim().replace(/ USD| Rank|•\n|\n/g, '').split(' ').filter(Boolean);
					desc += `**${ign}** \`\`${product[0]} - $${product[1]}\`\`\n`;
				});

				return resolve({ top: [top_ign, top_amount, top_avatarURL], body: desc });
			});
	});
};

exports.top = (type) => {
	let url = 'http://meepcraft.com/members/';

	return new Promise((resolve, reject) => {
		switch (type) {
		case 'messages': break;
		case 'message': break;
		case 'likes': url = `${url}?type=likes`; break;
		case 'trophy':
		case 'points': url = `${url}?type=points`; break;
		case 'staff': url = `${url}?type=staff`; break;
		default: return reject('Valid methods: \`\`message(s)\nlikes\ntrophy\npoints\nstaff\`\`');
		}

		fetch(url)
			.then((res) => res.text())
			.then(body => {
				const $ = cheerio.load(body);

				if (type !== 'staff') {
					let desc = '';
					$('li[class="primaryContent memberListItem"]').each((index, element) => {
						const user = $(element).find('h3[class="username"]').text();
						const info = $(element).find('div[class="extra"]').text();

						desc += `**${user}** \`\`${info} ${type}\`\`\n`;
					});
					return resolve(desc.trim());
				}
				else {
					let groups = '';
					$('div[class="titleGroup"]').each((index, element) => {
						const title = $(element).text();
						$(element).next().find('h3[class="username"]').each(() => {
							const user = $(element).text();
							groups += `${title} **${user}**\n`;
						});
					});
					return resolve(groups);
				}
			});
	});
};

exports.postOP = (link) => {
	return new Promise((resolve, reject) => {
		link = isNaN(link) ? link : `http://meepcraft.com/threads/.${link}`;
		if(!validator.isURL(link, { protocols:['http'], require_protocol: true, host_whitelist:['meepcraft.com'] }) || !link.match(/\/threads\/(.*?)\./g)) {
			return reject(new Error(`The link provided is **not** valid! (${link.substr(0, 500)})`));
		}

		fetch(link)
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);

				if ($('label[class="OverlayCloser"]').text() == 'The requested thread could not be found.') return reject(new Error('**Error:** the thread has been removed/deleted.'));

				const opPost = $('ol[id="messageList"]').find('li').first().find('div[class="messageContent"]').text().trim();
				const opAuthor = $('ol[id="messageList"]').find('li').first().find('h3[class="userText"]').find('a').text();
				const postedIn = $('p[id="pageDescription"]').find('a').first().text();
				const timePosted = $('p[id="pageDescription"]').find('span[class=DateTime]').attr('title');
				const postTitle = $('div[class="titleBar"]').find('h1').text();

				if (opPost == '' || opAuthor == '' || postedIn == '' || postTitle == '') return reject(new Error('**Error:** the post could not be found.'));
				return resolve({ text: opPost, author: opAuthor, forum: postedIn, date: typeof timePosted !== 'undefined' ? timePosted : 'N/A', title: postTitle, url: link });
			}).catch((err) => {
				return reject(err);
			});
	});
};

exports.postComments = function(link) {
	return new Promise(function(resolve, reject) {
		link = isNaN(link) ? link : `http://meepcraft.com/threads/.${link}`;
		if(!validator.isURL(link, { protocols:['http'], require_protocol: true, host_whitelist:['meepcraft.com'] }) || !link.match(/\/threads\/(.*?)\./g)) {
			return reject(new Error(`The link provided is **not** valid! (${link.substr(0, 500)})`));
		}

		fetch(link)
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);
				$('aside').remove();
				$('span[class="doublePostTagText"]').remove();

				if ($('label[class="OverlayCloser"]').text() == 'The requested thread could not be found.') return reject(new Error('**Error:** the thread has been removed/deleted.'));

				let found = '';
				let found2 = '';
				$('ol[class="messageList"]').find('li').next().each((index, element) => {
					const text = $(element).find('blockquote').first().text().trim().replace(/\s\s+/g, ' ');
					const date = $(element).find('span[class="DateTime"]').first().text().length > 0 ?  $(element).find('span[class="DateTime"]').first().text() : $(element).find('abbr[class="DateTime"]').first().text();
					const author = $(element).attr('data-author').valueOf().trim();
					if (text.length > 0 && index < 9) {
						found += `*${author}* on ${date}\n\`\`${text.substr(0, 125)}${text.length > 125 ? '...' : ''}\`\`\n`;
					} else {
						found2 += `*${author}* on ${date}\n\`\`${text.substr(0, 125)}${text.length > 125 ? '...' : ''}\`\`\n`;
					}
				});
				return resolve({ pOne: found, pTwo: found2 });
			});
	});
};

exports.userRecentPosts = (uid) => {
	return new Promise(function(resolve, reject) {
		fetch(`http://meepcraft.com/members/.${uid.id}/recent-content`)
			.then((res) => res.text())
			.then(async (body) => {
				const $ = cheerio.load(body);

				let posts = '';
				$('ol').eq(1).find('li').each((index, element) => {
					const postType = $(element).find('div[class="titleText"]').find('span[class="contentType"]').html();
					const postTitle = $(element).find('div[class="titleText"]').find('a').text();
					const link = $(element).find('div[class="titleText"]').find('a').attr('href').valueOf();
					const date = $(element).find('span[class="DateTime"]').text() == '' ? $(element).find('abbr[class="DateTime"]').text() : $(element).find('span[class="DateTime"]').text();
					posts += `*${postType}* on ${date}\n**${postTitle}**\n\`\`http://meepcraft.com/${link}\`\`\n\n`;
				});
				if (posts == '' || posts.length == 0) return reject(new Error('**Error:** no posts found.'));
				return resolve({ content: posts, id: uid.id, link: uid.link });
			}).catch((err) => {
				return reject(err);
			});
	});
};

setInterval(() => {
	con.query('SELECT 1');
}, 60000);
