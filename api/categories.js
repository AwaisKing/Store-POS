const app        = require('express')();
const server     = require('http').Server(app);
const bodyParser = require('body-parser');
const Datastore  = require('nedb');
const async      = require('async');

app.use(bodyParser.json());

module.exports = app;

let categoryDB = new Datastore({
    filename: process.env.APPDATA + '/' + process.env.npm_package_name + '/server/databases/categories.db',
    autoload: true,
});

categoryDB.ensureIndex({fieldName: '_id', unique: true});

app.get('/', (req, res) => { res.send('Category API'); });
app.get('/all', (req, res) => { categoryDB.find({}, (err, docs) => { res.send(docs); }); });
app.post('/category', (req, res) => {
    let newCategory = req.body;
    newCategory._id = Math.floor(Date.now() / 1000);
    categoryDB.insert(newCategory, (err, category) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.delete('/category/:categoryId', (req, res) => {
    categoryDB.remove({_id: parseInt(req.params.categoryId)}, (err, numRemoved) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.put('/category', (req, res) => {
    categoryDB.update({_id: parseInt(req.body.id)}, req.body, {}, (err, numReplaced, category) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});