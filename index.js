const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.payment_key);
const multer = require('multer');

const fetch = require('node-fetch');




// middleware
app.use(cors());



app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());

const upload = multer();




const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

const img_hosting_url = `https://api.imgbb.com/1/upload?key=${process.env.img_hosting_token}`


app.post('/upload', upload.single('image'), (req, res) => {
    const imageBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const contentType = req.file.mimetype;

    console.log(req.body);
    console.log(img_hosting_url);

    fetch(img_hosting_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(imageBuffer.toString('base64'))}&name=${encodeURIComponent(fileName)}&content_type=${encodeURIComponent(contentType)}`,
    })
        .then(response => response.json())
        .then(imgResponse => {
            res.json(imgResponse);
        })
        .catch(error => {
            res.status(500).json({ error: 'Failed to upload image' });
        });
});

// 
// 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.SEARCH_USER}:${process.env.SEARCH_PASS}@cluster0.kaq6cez.mongodb.net/?retryWrites=true&w=majority`;





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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        
        const userCollection = client.db("Search360").collection("users");
        const classesCollection = client.db("Search360").collection("classes");
        const selectClassCollection = client.db("Search360").collection("selectClass");
        const enrollClassCollection = client.db("Search360").collection("enrollClass");
        


        app.post("/jwt",  (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: '5hr' });
            return res.send({token})
        })

      const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray();
             return res.send(result);
        })

        app.post("/classes", async (req, res) => {
            const newclass = req.body;
            const result = await classesCollection.insertOne(newclass);
            return res.send(result);
        })

        //after make payment...seat are reduce from available seat...

        app.patch("/classes/:id", async (req, res) => {
            const id = req.params.id;
            const updateSeat = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {

                    seat: updateSeat.restSeat
                }
            }
            const result = await classesCollection.updateOne(filter, updateDoc, options)
            return res.send(result)
        })
        
        // app.patch('/classes/admin/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const info = req.body;
        //     console.log(info.status);
        //     const filter = { _id: new ObjectId(id) };
        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             status: info.status
        //         },
        //     };

        //     const result = await classesCollection.updateOne(filter, updateDoc, options);
        //     return  res.send(result);

        // })

        app.get("/class/select", async (req, res) => {
            
            const result = await selectClassCollection.find().toArray();
            return res.send(result);
        })

        app.get("/class/select/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await selectClassCollection.findOne(query);
            return res.send(result);
        })

        app.post("/class/select", async (req, res) => {
            const selectclass = req.body;
            const result = await selectClassCollection.insertOne(selectclass);
            return res.send(result);
        })

        app.delete("/class/select/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await selectClassCollection.deleteOne(query);
            return res.send(result);
        })
        

        app.get("/class/enroll", async (req, res) => {
            const result = await enrollClassCollection.find().toArray();
            return res.send(result)
        })

        app.post("/class/enroll", async (req, res) => {
            const enrollClass = req.body;
            const result = await enrollClassCollection.insertOne(enrollClass);
            return res.send(result);
        })

        



        // //user info insert to db...
        app.get("/users", async (req, res) => {
           
            const result = await userCollection.find().toArray();
            return res.send(result);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;

            // if (req.decoded.email !== email) {
            //     return res.send({ admin: false })
            // }

            const query = { email: email }
            if (!query) {
                return res.send({admin: false})
            }
            const user = await userCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            return res.send(result);
        })

        app.get('/users/instractor/:email', async (req, res) => {
            const email = req.params.email;

            // if (req.decoded.email !== email) {
            //     return res.send({ admin: false })
            // }

            const query = { email: email }
            console.log(query)
            if (!query) {
                return res.send({ instractor: false })
            }
            const user = await userCollection.findOne(query);
            const result = { instractor: user?.role === 'instractor' }
            return res.send(result);
        })


        app.post("/users",  async (req, res) => {
           
            const user = req.body;
         
            
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({message:"user alreay in exists"})
            }
            const result = await userCollection.insertOne(user); 
            return res.send(result);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                return res.send({ admin: false })
            }

            const query = { email: email }
            const user = await userCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            return res.send(result);
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const info = req.body;
            console.log(info);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: info.status
                },
            };

            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        })


        

       
        

        

        // //payment api....

        app.post("/create-payment-intent", async (req, res) => {
            const {price} = req.body;

            const amount = price * 100;
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount:amount,
                currency: "usd",
                payment_method_types: [
                    "card"
                ]
            });

             res.send({
                  clientSecret: paymentIntent.client_secret,
            });
        });



        // ///payment user info api,,,,,

        
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('search 360 is set up')
})

app.listen(port, () => {
    console.log(`search360 is sitting on port ${port}`);
})



