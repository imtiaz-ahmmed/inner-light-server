const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ivs96aw.mongodb.net/?retryWrites=true&w=majority`;

async function run() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    // Connect the client to the server
    await client.connect();

    const classesCollection = client.db("inner-light-db").collection("classes");
    const instructorsCollection = client
      .db("inner-light-db")
      .collection("instructors");

    app.get("/classes", async (req, res) => {
      const cursor = classesCollection
        .find()
        .sort({ availableSeats: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      const cursor = instructorsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("inner-light is running");
    });

    app.listen(port, () => {
      console.log(`Inner Light Server is running on port ${port}`);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);
