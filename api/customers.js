const app        = require('express')();
const server     = require('http').Server(app);
const bodyParser = require('body-parser');
const Datastore  = require('nedb');
const async      = require('async');

app.use(bodyParser.json());

module.exports = app;

let customerDB = new Datastore({
    filename: process.env.APPDATA + '/' + process.env.npm_package_name + '/server/databases/customers.db',
    autoload: true,
});
customerDB.ensureIndex({fieldName: '_id', unique: true});

app.get('/', (req, res) => {
    res.send('Customer API');
});
app.get('/all', (req, res) => {
    customerDB.find({}, (err, docs) => {
        res.send(docs);
    });
});
app.get('/customer/:customerId', (req, res) => {
    if (!req.params.customerId) res.status(500).send('ID field is required.');
    else customerDB.findOne({_id: req.params.customerId}, (err, customer) => { res.send(customer); });
});
app.post('/customer', (req, res) => {
    const newCustomer = req.body;
    customerDB.insert(newCustomer, (err, customer) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.delete('/customer/:customerId', (req, res) => {
    customerDB.remove({_id: req.params.customerId}, (err, numRemoved) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.put('/customer', (req, res) => {
    let customerId = req.body._id;
    customerDB.update({_id: customerId}, req.body, {}, (err, numReplaced, customer) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});