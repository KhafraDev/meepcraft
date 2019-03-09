const fetch = require('node-fetch');

module.exports = () => {
	return new Promise((resolve, reject) => {
		fetch('http://meepcraft.com/game/query.php')
			.then((res) => res.json())
			.then(body => {
				return resolve(body);
            })
            .catch(err => {
                return reject({ error: err });
            })
	});
};