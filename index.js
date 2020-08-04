const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');
let server = require('http').createServer(app);
let io = require('socket.io')(server);
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const file = [
    'menu.json',
    'orders.json',
    'users.json'
];

app.use(cors());
app.use(bodyParser.json());


// ELEMENTARY FUNCTIONS
// --------------------

function writeFile(fileName, dataStore) {
    let data = JSON.stringify(dataStore);
    fs.writeFileSync(`data/${fileName}`, data);
}

function readFile(fileName) {
    let x = fs.readFileSync(`data/${fileName}`, 'utf8');
    return x.length ? JSON.parse(x) : [];
}

function appendFile(fileName, data) {
    let fileData = readFile(fileName);
    fileData.push(data);
    writeFile(fileName, fileData);
}

// ORDER FUNCTIONS
// ---------------

function getMenu() {
    return readFile(file[0])
}

function addOrder(order) {
    appendFile(file[1], order);
}

function getOrders() {
    return readFile(file[1]);
}

function generateOrderId() {
    const dateTime = new Date();

    const year = dateTime.getFullYear().toString();

    const m = (dateTime.getMonth() + 1);
    const month = m < 10 ? ('0' + m.toString()) : m.toString();

    const d = dateTime.getDate();
    const date = d < 10 ? ('0' + d.toString()) : d.toString();

    const h = dateTime.getHours();
    const hours = h < 10 ? ('0' + h.toString()) : h.toString();

    const min = dateTime.getMinutes();
    const minutes = min < 10 ? ('0' + min.toString()) : min.toString();

    const s = dateTime.getSeconds();
    const seconds = s < 10 ? ('0' + s.toString()) : s.toString();

    const ms = dateTime.getMilliseconds();
    let miliseconds;
    if (ms < 10) {
        miliseconds = '00' + ms.toString();
    } else if (ms < 100) {
        miliseconds = '0' + ms.toString();
    } else {
        miliseconds = ms.toString();
    }

    return parseInt(year + month + date + hours + minutes + seconds + miliseconds);
}


// PROFILE FUNCTIONS
// -----------------

function addUser(data) {
    appendFile(file[2], data);
}


// SOCKET CONNECTION

io.on('connection', (socket) => {
    socket.emit('menu', getMenu());

    socket.on('menu', () => console.log('menu event triggered'));

    socket.on('set-order', (data) => {
        addOrder(data);
        socket.emit('get-orders', getOrders())
    });

    socket.on('get-order', () => console.log('menu event triggered'));

    socket.on('new-user', (data) => {
        // data.name
        let userData = addUser(data.name);
        socket.
            console.log('menu event triggered')
    });

    socket.on('disconnect', () => console.log('disconnected from server'));
});


// APIS

app.get('/menu', (req, res) => res.send(getMenu()));
app.post('/place-order', (req, res) => {
    let data = req.body;
    data.order_id = generateOrderId();
    addOrder(req.body);
    // emit socket event here
    res.json({ order_id: data.order_id });
});
app.post('/add-user', (req, res) => {
    let data = {
        id: uuidv4(),
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        emp_code: req.body.emp_code
    }
    addUser(data);
    res.json(data);
});


server.listen(process.env.PORT || 3333, () => console.log(`listening on ${process.env.PORT || 3333}`));