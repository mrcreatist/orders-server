const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');
let server = require('http').createServer(app);
let io = require('socket.io')(server);
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const file = [
    'data/menu.json',
    'data/orders.json',
    'data/users.json'
];

app.use(cors());
app.use(bodyParser.json());


// ELEMENTARY FUNCTIONS

function writeFile(fileName, dataStore) {
    let data = JSON.stringify(dataStore);
    fs.writeFileSync(fileName, data);
}

function readFile(fileName) {
    let x = fs.readFileSync(fileName, 'utf8');
    return x.length ? JSON.parse(x) : [];
}

function appendFile(fileName, data) {
    let fileData = readFile(fileName);
    fileData.push(data);
    writeFile(fileName, fileData);
}

// FILE CHECK FUNCTION
(file.forEach(i => fs.exists(i, (proof) => proof ? null : writeFile(i, []))));


// ORDER FUNCTIONS

function getMenu() {
    return readFile(file[0])
}

function addOrder(order) {
    appendFile(file[1], order);
}

function getActiveOrders() {

    let finalOrder = [];

    let orders = readFile(file[1]);
    let activeOrder = orders.filter(x => x.status === true);

    let activeUserID = [];
    activeOrder.forEach(x => activeUserID.indexOf(x.user_id) > -1 ? null : activeUserID.push(x.user_id));

    let userDetails = readFile(file[2]).filter(x => activeUserID.indexOf(x.id) > -1 ? x : null);

    userDetails.forEach(u => finalOrder.push({
        name: `${u.first_name} ${u.last_name}`,
        user_id: u.id,
        active: true,
        data: []
    }));

    let userOrders = [];
    activeUserID.forEach(x => userOrders.push(activeOrder.filter(y => y.user_id === x)));

    userOrders.forEach((u, index) => {
        let itemNames = [];

        u.forEach(s => {
            let check = itemNames.filter(f => f.id === s.item);
            if (!check.length) {
                itemNames.push({
                    id: s.item,
                    item: readFile(file[0]).filter(r => r.id === s.item)[0].item,
                    quantity: s.quantity
                });
            } else {
                check[0].quantity += s.quantity;
            }
        });

        finalOrder[index].data = itemNames;
        itemNames = [];
    });

    return {
        order: finalOrder
    };
}

function orderComplete(data) {
    let orders = readFile(file[1]);
    orders.forEach(o => o.user_id === data.user_id ? o.status = false : null);
    writeFile(file[1], orders);
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

function addUser(data) {
    appendFile(file[2], data);
}

// SOCKET CONNECTION

io.on('connection', (socket) => {

    socket.on('get-orders', () => socket.emit('all-orders', getActiveOrders()));

    socket.on('all-orders', () => console.log('all-orders event triggered!'));

    socket.on('order-complete', (data) => orderComplete(data));

    socket.on('disconnect', () => console.log('disconnected from server'));
});


// APIS

app.get('/menu', (req, res) => res.send(getMenu()));

app.post('/place-order', (req, res) => {
    let data = req.body;
    data.status = true;
    addOrder(req.body);
    res.json({ message: 'order placed' });
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

let port = process.env.PORT || 3334;
server.listen(port, () => console.log(`listening on ${port}`));