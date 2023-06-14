const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    const usersCollection = client.db("inner-light-db").collection("user");
    const classesCollection = client.db("inner-light-db").collection("classes");
    const instructorsCollection = client
      .db("inner-light-db")
      .collection("instructors");
    const selectedClassCollection = client
      .db("inner-light-db")
      .collection("selectedClasses");

    app.get("/classes", async (req, res) => {
      const cursor = classesCollection
        .find()
        .sort({ availableSeats: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/all-classes", async (req, res) => {
      const cursor = classesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      const cursor = instructorsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/all-instructors", async (req, res) => {
      const cursor = instructorsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/all-instructors/instructor/:instructorName", async (req, res) => {
      const name = req.params.instructorName;
      const query = { instructorName: name };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });

    app.get("/selectedClasses", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      } else {
        const query = { studentEmail: email };
        const result = await selectedClassCollection.find(query).toArray();
        res.send(result);
      }
    });

    //POST METHODS

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.post("/selectedClasses", async (req, res) => {
      const classes = req.body;
      console.log(classes);
      const result = await selectedClassCollection.insertOne(classes);
      res.send(result);
    });

    //DELETE METHODS

    app.delete("/selectedClasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassCollection.deleteOne(query);

      if (result.deletedCount > 0) {
        res.send({ deleteCount: result.deletedCount });
      } else {
        res.status(400).send({ message: "The file could not be deleted." });
      }
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
