const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//midlewares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.obhdclo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const toyCollection = client.db("toydb").collection("toys")
        await client.connect();

        const indexKeys = { name: 1 };
        const indexOptions = { name: "searchByName" };

        const result = await toyCollection.createIndex(indexKeys, indexOptions);
        console.log(result);

        app.get("/toySearch/:text", async (req, res) => {
            const searchText = req.params.text;
            // console.log(searchText);
            const result = await toyCollection
                .find({
                    $or: [
                        { name: { $regex: searchText, $options: "i" } }
                    ],
                })
                .toArray();
            res.send(result);
        });

        app.post('/toy', async (req, res) => {
            const newToy = req.body;
            // console.log(newToy);
            const result = await toyCollection.insertOne(newToy)
            res.send(result)
        })

        app.get('/toy', async (req, res) => {
            const limit = parseInt(req.query.limit) || 20;
            // console.log(limit);
            const cursor = toyCollection.find();
            const result = await cursor.limit(limit).toArray();
            res.send(result)
        })
        app.get('/filterdToy', async (req, res) => {
            const search = req.query.search;
            const filter = parseInt(req.query.filter) || 1;
            // console.log(filter);
            const query = { email: search }
            const cursor = toyCollection.find(query).sort({ price: filter });
            const result = await cursor.toArray();
            res.send(result)
        })

        

        app.get('/toy/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.findOne(query);
            res.send(result)
        })

        app.put("/toy/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedToy = req.body;
            const toy = {
                $set: {
                    description: updatedToy.description,
                    price: updatedToy.price,
                    quantity: updatedToy.quantity
                }
            }
            const result = await toyCollection.updateOne(filter, toy, options);
            res.send(result)

        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Toy store server is running")
})

app.listen(port)