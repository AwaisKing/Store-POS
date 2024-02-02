const app        = require('express')();
const server     = require('http').Server(app);
const bodyParser = require('body-parser');
const Datastore  = require('nedb');
const btoa       = require('btoa');
app.use(bodyParser.json());

module.exports = app;


let usersDB = new Datastore({
    filename: `${process.env.APPDATA}/${process.env.npm_package_name}/server/databases/users.db`,
    autoload: true,
});
usersDB.ensureIndex({fieldName: '_id', unique: true});


app.get('/', (req, res) => {
    res.send('Users API');
});
app.get('/all', (req, res) => {
    usersDB.find({}, (err, docs) => { res.send(docs); });
});
app.get('/user/:userId', (req, res) => {
    if (!req.params.userId) res.status(500).send('ID field is required.');
    else usersDB.findOne({_id: parseInt(req.params.userId)}, (err, docs) => { res.send(docs); });
});
app.get('/logout/:userId', (req, res) => {
    if (!req.params.userId) res.status(500).send('ID field is required.');
    else {
        usersDB.update({_id: parseInt(req.params.userId)}, {$set: {status: 'Logged Out_' + new Date()}}, {});
        res.sendStatus(200);
    }
});
app.post('/login', (req, res) => {
    usersDB.findOne({username: req.body.username, password: btoa(req.body.password)}, (err, docs) => {
        if (docs) usersDB.update({_id: docs._id}, {$set: {status: 'Logged In_' + new Date()}}, {});
        res.send(docs);
    });
});
app.delete('/user/:userId', (req, res) => {
    usersDB.remove({_id: parseInt(req.params.userId)}, (err, numRemoved) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.post('/post', (req, res) => {
    if (req.body.id == '') {
        let User = {
            'username'         : req.body.username,
            'password'         : btoa(req.body.password),
            'fullname'         : req.body.fullname,
            'perm_products'    : req.body.perm_products == 'on' ? 1 : 0,
            'perm_categories'  : req.body.perm_categories == 'on' ? 1 : 0,
            'perm_transactions': req.body.perm_transactions == 'on' ? 1 : 0,
            'perm_users'       : req.body.perm_users == 'on' ? 1 : 0,
            'perm_settings'    : req.body.perm_settings == 'on' ? 1 : 0,
            'status'           : '',
        }
        User._id = Math.floor(Date.now() / 1000);
        usersDB.insert(User, (err, user) => {
            if (err) res.status(500).send(req);
            else res.send(user);
        });
    } else {
        usersDB.update({_id: parseInt(req.body.id)}, {
            $set: {
                username         : req.body.username,
                password         : btoa(req.body.password),
                fullname         : req.body.fullname,
                perm_products    : req.body.perm_products == 'on' ? 1 : 0,
                perm_categories  : req.body.perm_categories == 'on' ? 1 : 0,
                perm_transactions: req.body.perm_transactions == 'on' ? 1 : 0,
                perm_users       : req.body.perm_users == 'on' ? 1 : 0,
                perm_settings    : req.body.perm_settings == 'on' ? 1 : 0,
            },
        }, {}, (err, numReplaced, user) => {
            if (err) res.status(500).send(err);
            else res.sendStatus(200);
        });
    }
});
app.get('/check', (req, res) => {
    usersDB.findOne({_id: 1}, (err, docs) => {
        if (docs) return;
        let User = {
            '_id'              : 1,
            'username'         : 'admin',
            'password'         : btoa('admin'),
            'fullname'         : 'Administrator',
            'perm_products'    : 1,
            'perm_categories'  : 1,
            'perm_transactions': 1,
            'perm_users'       : 1,
            'perm_settings'    : 1,
            'status'           : '',
        }
        usersDB.insert(User, (err, user) => { });
    });
});