//importing
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//declaring port
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
    const authHead = req.headers.authorization;
    if (!authHead) {
        return res.status(401).send({ message: 'You are not authorized' });
    }
    const token = authHead.split(' ')[1];
    jwt.verify(token, process.env.AC_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Not allowed' })
        }

        req.decoded = decoded;

        next();
    });


}
//mongodb connect



const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4k90o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//asyncfunction run 
async function run() {
    try {
        client.connect();
        const itemCollection = client.db("johnDeal").collection("items");
        const pricingCollection = client.db("johnDeal").collection("pricing");
        //this will use to use jwt
        app.get('/items', verifyJWT, async (req, res) => {
            const decodeEmail = req.decoded?.email;


            const email = req.query.email;

            if (decodeEmail === email) {
                const display = parseInt(req.query.display);
                const query = {
                    userEmail: req.query.email
                };
                const cursor = itemCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Your access has been forbiden' });
            }

        })
        //display first 6 and manage inventory
        app.get('/items6', async (req, res) => {


            const display = parseInt(req.query.display);
            const query = {};
            const cursor = itemCollection.find(query).limit(display);
            const result = await cursor.toArray();
            res.send(result);
        })
        //display pricing
        app.get('/pricing', async (req, res) => {
            const query = {};
            const cursor = pricingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        //get a item and post it
        app.post('/items', async (req, res) => {
            const info = req.body;
            const inserting = itemCollection.insertOne(info);
            res.send({ message: 'Successfull' });

        })
        //find a item by his id
        app.get('/items/:id', async (req, res) => {
            const id = req.params;

            const query = {
                _id: ObjectId(id)
            }
            const findingItem = await itemCollection.findOne(query);
            res.send(findingItem)
        })
        //find a item and update its data
        app.put('/items/:id', async (req, res) => {
            const id = req.params.id;

            const query = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: `${req.body.quantity}`,
                    sold: `${req.body.sold}`,
                },
            }
            const result = await itemCollection.updateOne(query, updateDoc, options);

            res.send({ message: 'done' })
        })
        // find a item and delete the document

        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const deleteItem = await itemCollection.deleteOne(filter);
            res.send({ message: 'Item has been deleted' })
        })

        //this will show the total sold and delivered
        app.get('/info', async (req, res) => {

            const query = {};
            const cursor = itemCollection.find(query);
            const result = await cursor.toArray();

            let totaSold = 0;
            let totalPrice = 0;
            let totalQuantity = 0;

            result.forEach(item => {
                totaSold = totaSold + parseInt(item?.sold)
                const singleCarTotalPrice = parseFloat(item?.price) * parseFloat(item?.sold)
                totalPrice = totalPrice + singleCarTotalPrice;
                totalQuantity = totalQuantity + parseInt(item?.quantity);
            })

            res.send({
                totalSold: totaSold,
                totalPrice: Math.floor(totalPrice),
                totalQuantity: totalQuantity
            });
        })

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.AC_TOKEN, {
                expiresIn: '1d'
            });

            res.send({ accessToken: accessToken });

        })

    }
    finally {

    }
}
run().catch(err => console.log(err))
//initial connect

app.get('/', (req, res) => {
    res.send('This server is running ')
})
app.listen(port, () => {
    console.log('Listening to the port', port)
})