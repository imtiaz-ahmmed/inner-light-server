const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(
  "sk_test_51NJYSrKJgobm6GED3PSLTXdCP086TRi5j98YUpt5i0uivo4Tsdrh1X8OzqVIV3Q4tfZehJ5CxTyJOMOvu0WDOwuH00EfkWeDxF"
);
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};
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
    const addClassesCollection = client
      .db("inner-light-db")
      .collection("addClasses");
    const classesCollection = client.db("inner-light-db").collection("classes");
    const instructorsCollection = client
      .db("inner-light-db")
      .collection("instructors");
    const selectedClassCollection = client
      .db("inner-light-db")
      .collection("selectedClasses");
    const paymentCollection = client
      .db("inner-light-db")
      .collection("payments");

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
        return res
          .status(400)
          .send({ error: true, message: "Email parameter is missing." });
      }

      const query = { studentEmail: email };
      try {
        const result = await selectedClassCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving selected classes:", error);
        res.status(500).send({
          error: true,
          message: "An error occurred while retrieving selected classes.",
        });
      }
    });
    app.get("/payments", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res
          .status(400)
          .send({ error: true, message: "Email parameter is missing." });
      }

      const query = { email: email };
      const sort = { date: -1 }; // Sort by date field in descending order

      try {
        const result = await paymentCollection.find(query).sort(sort).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving selected classes:", error);
        res.status(500).send({
          error: true,
          message: "An error occurred while retrieving selected classes.",
        });
      }
    });

    //Verify User Admin/student/Instructor

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.get("/users/instructor/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
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

    app.post("/add-classes", async (req, res) => {
      const newItem = req.body;
      const result = await addClassesCollection.insertOne(newItem);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    //Manage class
    app.post("/add-classes", (req, res) => {
      const { className, classDescription } = req.body;
      const newClass = {
        id: uuidv4(),
        className,
        classDescription,
        feedback: [],
      };

      classes.push(newClass);

      res.json({ message: "Class added successfully", class: newClass });
    });

    //payment

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);
      const query = {
        _id: new ObjectId(payment.enrolledClassId),
      };
      const deleteResult = await selectedClassCollection.deleteOne(query);
      res.send({ insertResult, deleteResult });
    });

    //PATCH METHODS

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //Manage Class
    app.patch("/add-classes/:classId", async (req, res) => {
      const classId = req.params.classId;
      const updateData = req.body;

      try {
        const filter = { _id: new ObjectId(classId) };
        const updateResult = await addClassesCollection.updateOne(filter, {
          $set: updateData,
        });

        if (updateResult.modifiedCount === 1) {
          res.sendStatus(200);
        } else {
          res.sendStatus(404);
        }
      } catch (error) {
        console.error("Error updating class:", error);
        res.sendStatus(500);
      }
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
