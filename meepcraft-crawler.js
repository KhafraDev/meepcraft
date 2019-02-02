const fetch = require('node-fetch');
const cheerio = require('cheerio');
const mysql = require('mysql');

// slow down the amount of requests that can be made per second
const throttledQueue = require('throttled-queue');
const throttle = throttledQueue(3, 1000);

let con;
let standard_input = process.stdin.setEncoding('utf-8');

console.log(
`Type 'mysql [host] [username] [password] [database name]' to save results to database.
Type 'exit' to exit.
Enter anything else to continue.`
);

standard_input.on('data', function (data) {
    if(data.match(/exit/g)){
        process.exit();
    } else if(data.match(/mysql/g)) {
        data = data.replace(/\r|\n/g, '').split(' ');
        if(!data[4]) throw new Error(`Type 'mysql [host] [username] [password] [database name]' to save results to database.`);
        con = mysql.createConnection({
            host: data[1],
            user: data[2],
            password: data[3],
            database: data[4],
        });

        con.connect(function(err) {
            if(err) throw err;
            loop();
        })
    } else {
        console.log(`You are currently not connected to the database. Running this program is useless.`);
        loop();
    }
});

function loop(min = 1, max = 42734) {
    for(let i = 1; i <= 42734; i++) {
        throttle(function() {
            fetch(`http://meepcraft.com/members/.${i}`)
                .then(res => res.text())
                .then(async body => {
                    let $ = cheerio.load(body);
                    let name = $('h1[class="username"]').text().replace(/[&\/\\#,+()$~%.`'":*?<>{}]/g,'\\$&');

                    if(name !== "" && typeof con !== "undefined") {
                        con.query(`INSERT INTO users (name, id) VALUES ("${name}", "${i}")`, function (err, result) {
                            if (err) throw err;
                            console.log(`Inserted "${name}" with userid ${i}.`)
                        });
                    } else {
                        console.log(`Found "${name}" with userid ${i}.`)
                    }
                })
        });
    }
}