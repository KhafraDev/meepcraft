const routes = require('express').Router();
const cache = require('memory-cache');

const meep = {
        stats : require('../meep/meep-stats'),
        OnlineForums : require('../meep/meep-online-forums'),
        OnlineGame : require('../meep/meep-online-ingame'),
        staff : require('../meep/meep-staff'),
        user : require('../meep/meep-user'),
        shop : require('../meep/meep-shop'),
        recent : require('../meep/meep-recent'),
        recentUser : require('../meep/meep-recent-user'),
        posts : require('../meep/meep-posts'),
        comments : require('../meep/meep-posts-comments')
};
   
routes.get('/stats', (req, res, next) => {
    if(cache.get('stats')) {
        const r = cache.get('stats');
        return res.render('pages/stats.ejs', {
            threads: r.threads,
            messages: r.messages,
            members: r.members,
            recordMembers: r.recordMembers,
            latestMember: r.latestMember,
            latestMemberURL: r.latestMemberURL
        });
    }
    meep.stats()
        .then(r => {
            cache.put('stats', r, 10000);
            //res.send(r);
            res.render('pages/stats.ejs', {
                threads: r.threads,
                messages: r.messages,
                members: r.members,
                recordMembers: r.recordMembers,
                latestMember: r.latestMember,
                latestMemberURL: r.latestMemberURL
            });
        })
        .catch(err => {
            next(err);
        });
});

//Total: 52 (members: 4, guests: 42, robots: 6) 
routes.get('/online', (req, res, next) => {
    if(cache.get('OnlineForums') && cache.get('OnlineGame')) {
        const forums = cache.get('OnlineForums');
        const ingame = cache.get('OnlineGame');
        return res.render('pages/online.ejs', {
            forumsOnline: forums.members,
            forumsOnlineTotal: forums.footer[0],
            forumsOnlineMembers: forums.footer[1],
            forumsOnlineGuests: forums.footer[2],
            forumsOnlineRobots: forums.footer[3],
            gameOnline: ingame.playersOnline
        });
    }
    Promise.all([meep.OnlineForums(), meep.OnlineGame()])
        .then(([forums, ingame]) => {
            cache.put('OnlineForums', forums, 300000); // 5 mins
            cache.put('OnlineGame', ingame, 300000); // 5 mins
            //res.send({ forums: forums, ingame: ingame });
            res.render('pages/online.ejs', {
                forumsOnline: forums.members,
                forumsOnlineTotal: forums.footer[0],
                forumsOnlineMembers: forums.footer[1],
                forumsOnlineGuests: forums.footer[2],
                forumsOnlineRobots: forums.footer[3],
                gameOnline: ingame.playersOnline
            });
        })
        .catch(err => {
            next(err);
        })
});

routes.get('/staff', (req, res, next) => {
    if(cache.get('staff')) {
        return res.render('pages/staff.ejs', { staff: cache.get('staff') });
    }
    meep.staff()
        .then(r => {
            cache.put('staff', r, 3600000); // 1 hour
            res.render('pages/staff.ejs', {
                staff: r
            });
        })
        .catch(err => {
            next(err);
        })
});

routes.get('/user', (req, res) => {
    if(cache.get(`user-${req.query.id}`)) {
        const r = cache.get(`user-${req.query.id}`);
        return res.render('pages/user.ejs', {
            id: r.id,
            title: r.title,
            status: r.status,
            birthday: r.birthday,
            blurb: r.blurb,
            followBlock: r.followBlock
        });
    } else if(isNaN(parseInt(req.query.id))) {
        return res.status(500).json({ err: parseInt(req.query.id) });
    }
    meep.user(req.query.id)
        .then(r => {
            cache.put(`user-${r.id}`, r, 7200000); // 2 hours
            res.render('pages/user.ejs', {
                id: r.id,
                title: r.title,
                status: r.status,
                birthday: r.birthday,
                blurb: r.blurb,
                followBlock: r.followBlock
            });
        })
});

routes.get('/shop', (req, res) => {
    if(cache.get('shop')) {
        const r = cache.get('shop');
        return res.render('pages/shop.ejs', {
            top: r.top, // will fix when someone donates
            purchases: r.payments
        });
    }
    meep.shop()
        .then(r => {
            cache.put('shop', r, 3600000); // 1 hour
            //res.send(r);
            res.render('pages/shop.ejs', {
                top: r.top, // will fix when someone donates
                purchases: r.payments
            });
        })
});

routes.get('/recent', (req, res) => {
    if(cache.get('recent')) {
        return res.render('pages/recent.ejs', { recent: cache.get('recent') });
    }
    meep.recent()
        .then(r => {
            cache.put('recent', r, 3600000);
            res.render('pages/recent.ejs', { recent: r });
        })
});

routes.get('/user_recent', (req, res, next) => {
    if(cache.get(`user_recent-${req.query.id}`)) {
        const r = cache.get(`user_recent-${req.query.id}`);
        return res.render('pages/user_recent.ejs', { posts: r.posts });
    } else if(isNaN(parseInt(req.query.id))) {
        return res.status(500).send('ID isNaN');
    }
    meep.recentUser(req.query.id)
        .then(r => {
            cache.put(`user_recent-${req.query.id}`, r, 3600000);
            res.render('pages/user_recent.ejs', { posts: r.posts });
        })
        .catch(err => {
            next({ err: err });
        })
});

routes.get('/posts', (req, res, next) => {
    if(cache.get(`posts-${req.query.id}`) && cache.get(`comments-${req.query.id}`)) {
        const post = cache.get(`posts-${req.query.id}`);
        return res.render('pages/posts.ejs', {
            text: post.text.split(/\n\n/g),
            author: post.author,
            forum: post.forum,
            date: post.date,
            url: post.url,
            comments: cache.get(`comments-${req.query.id}`)
        });
    }
    Promise.all([ meep.posts(req.query.id), meep.comments(req.query.id) ])
        .then(([post, comments]) => {
            cache.put(`posts-${req.query.id}`, post);
            cache.put(`comments-${req.query.id}`, comments);
            res.render('pages/posts.ejs', {
                text: post.text.split(/\n\n/g),
                author: post.author,
                forum: post.forum,
                date: post.date,
                url: post.url,
                comments: comments
            });
        })
});

routes.get('*', (req, res) => {
    res.status(404).send('Page not found!');
})

module.exports = routes;