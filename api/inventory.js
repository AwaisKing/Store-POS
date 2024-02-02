const app        = require('express')();
const server     = require('http').Server(app);
const bodyParser = require('body-parser');
const Datastore  = require('nedb');
const async      = require('async');
const fileUpload = require('express-fileupload');
const multer     = require('multer');
const fs         = require('fs');


const storage = multer.diskStorage({
    destination: process.env.APPDATA + '/' + process.env.npm_package_name + '/uploads',
    filename   : (req, file, callback) => { callback(null, Date.now() + '.jpg'); },
});
let upload    = multer({storage: storage});

app.use(bodyParser.json());

module.exports = app;

let inventoryDB = new Datastore({
    filename: process.env.APPDATA + '/' + process.env.npm_package_name + '/server/databases/inventory.db',
    autoload: true,
});
inventoryDB.ensureIndex({fieldName: '_id', unique: true});


app.get('/', (req, res) => {
    res.send('Inventory API');
});
app.get('/product/:productId', (req, res) => {
    if (!req.params.productId) res.status(500).send('ID field is required.');
    else inventoryDB.findOne({_id: parseInt(req.params.productId)}, (err, product) => {
        res.send(product);
    });
});
app.get('/products', (req, res) => {
    inventoryDB.find({}, (err, docs) => { res.send(docs); });
});
app.post('/product', upload.single('imagename'), (req, res) => {
    let image = '';
    if (req.body.img != '') image = req.body.img;
    if (req.file) image = req.file.filename;
    if (req.body.remove == 1) {
        const path = './resources/app/public/uploads/product_image/' + req.body.img;
        try {
            fs.unlinkSync(path)
        } catch (err) {
            console.error(err)
        }
        if (!req.file) image = '';
    }

    let Product = {
        _id     : parseInt(req.body.id),
        price   : req.body.price,
        category: req.body.category,
        quantity: req.body.quantity == '' ? 0 : req.body.quantity,
        name    : req.body.name,
        stock   : req.body.stock == 'on' ? 0 : 1,
        img     : image,
    }

    if (req.body.id == '') {
        Product._id = Math.floor(Date.now() / 1000);
        inventoryDB.insert(Product, (err, product) => {
            if (err) res.status(500).send(err);
            else res.send(product);
        });
    } else inventoryDB.update({_id: parseInt(req.body.id)}, Product, {}, (err, numReplaced, product) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.post('/product/sku', (req, res) => {
    let request = req.body;
    inventoryDB.findOne({_id: parseInt(request.skuCode)}, (err, product) => {
        res.send(product);
    });
});
app.delete('/product/:productId', (req, res) => {
    inventoryDB.remove({_id: parseInt(req.params.productId)}, (err, numRemoved) => {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});
app.decrementInventory = products => {
    async.eachSeries(products, (transactionProduct, callback) => {
        inventoryDB.findOne({_id: parseInt(transactionProduct.id)}, (err, product) => {
            if (!product || !product.quantity) callback();
            else {
                let updatedQuantity = parseInt(product.quantity) - parseInt(transactionProduct.quantity);
                inventoryDB.update({_id: parseInt(product._id)}, {$set: {quantity: updatedQuantity}}, {}, callback);
            }
        });
    });
};