let express    = require('express'),
    http       = require('http'),
    app        = express(),
    server     = http.createServer(app),
    bodyParser = require('body-parser');

const PORT = process.env.PORT || 8001;

console.log('Server started');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.all('/*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');

    if (req.method === 'OPTIONS') res.status(200).end();
    else next();
});
app.get('/', (req, res) => { res.send('POS Server Online.'); });

app.use('/api/categories', require('./api/categories'));
app.use('/api/customers', require('./api/customers'));
app.use('/api/inventory', require('./api/inventory'));
app.use('/api/settings', require('./api/settings'));
app.use('/api/users', require('./api/users'));
app.use('/api', require('./api/transactions'));

server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));