let app        = require('express')();
// let server     = require('http').Server(app);
let bodyParser = require('body-parser');
let Datastore  = require('nedb');
let Inventory  = require('./inventory');

app.use(bodyParser.json());

module.exports = app;

let transactionsDB = new Datastore({
    filename: process.env.APPDATA + '/' + process.env.npm_package_name + '/server/databases/transactions.db',
    autoload: true,
});
transactionsDB.ensureIndex({fieldName: '_id', unique: true});


app.get('/', (req, res) => {
    res.send('Transactions API');
});
app.get('/all', (req, res) => {
    transactionsDB.find({}, (err, docs) => {
        res.send(docs);
    });
});
app.get('/on-hold', (req, res) => {
    transactionsDB.find(
        {$and: [{ref_number: {$ne: ''}}, {status: 0}]},
        (err, docs) => {
            if (docs) res.send(docs);
        },
    );
});
app.get('/customer-orders', (req, res) => {
    transactionsDB.find(
        {$and: [{customer: {$ne: '0'}}, {status: 0}, {ref_number: ''}]},
        (err, docs) => {
            if (docs) res.send(docs);
        },
    );
});
app.get('/by-date', (req, res) => {
    let startDate = new Date(req.query.start);
    let endDate   = new Date(req.query.end);

    if (req.query.user === 0 && req.query.till === 0) {
        transactionsDB.find(
            {$and: [{date: {$gte: startDate.toJSON(), $lte: endDate.toJSON()}}, {status: parseInt(req.query.status)}]},
            (err, docs) => {
                if (docs) res.send(docs);
            });
    }

    if (req.query.user !== 0 && req.query.till === 0) {
        transactionsDB.find(
            {$and: [{date: {$gte: startDate.toJSON(), $lte: endDate.toJSON()}}, {status: parseInt(req.query.status)}, {user_id: parseInt(req.query.user)}]},
            (err, docs) => {
                if (docs) res.send(docs);
            });
    }

    if (req.query.user === 0 && req.query.till !== 0) {
        transactionsDB.find(
            {$and: [{date: {$gte: startDate.toJSON(), $lte: endDate.toJSON()}}, {status: parseInt(req.query.status)}, {till: parseInt(req.query.till)}]},
            (err, docs) => {
                if (docs) res.send(docs);
            });
    }

    if (req.query.user !== 0 && req.query.till !== 0) {
        transactionsDB.find(
            {
                $and: [
                    {date: {$gte: startDate.toJSON(), $lte: endDate.toJSON()}},
                    {status: parseInt(req.query.status)},
                    {till: parseInt(req.query.till)},
                    {user_id: parseInt(req.query.user)},
                ],
            },
            (err, docs) => {
                if (docs) res.send(docs);
            },
        );
    }
});
app.post('/new', (req, res) => {
    let newTransaction = req.body;
    transactionsDB.insert(newTransaction, (err, transaction) => {
        if (err) res.status(500).send(err);
        else {
            res.sendStatus(200);
            if (newTransaction.paid >= newTransaction.total) Inventory.decrementInventory(newTransaction.items);
        }
    });
});
app.put('/new', (req, res) => {
    let oderId = req.body._id;
    transactionsDB.update({_id: oderId}, req.body, {}, (err, numReplaced, order) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.post('/delete', (req, res) => {
    let transaction = req.body;
    transactionsDB.remove({_id: transaction.orderId}, (err, numRemoved) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.get('/:transactionId', (req, res) => {
    transactionsDB.find({_id: req.params.transactionId}, (err, doc) => {
        if (doc) res.send(doc[0]);
    });
});