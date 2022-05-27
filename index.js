const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// MiddleWare:-----
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6jc0n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// JWT middle tier/ middle layer:
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      console.log({ err });
      return res.status(403).send({ message: "Forbidden Access" });
    }
    // console.log("verify user", { decoded });
    req.decoded = decoded;
    // console.log(req.decoded);
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("toolsManager").collection("products");
    const orderCollection = client.db("toolsManager").collection("orders");
    const userCollection = client.db("toolsManager").collection("users");
    const reviewCollection = client.db("toolsManager").collection("reviews");

    // Middle Layer For Verify admin:===
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        return res.status(403).send({ message: "Forbidden Access" });
      }
    };

    // PUT Api for unique user and JWT toknassign for each users:--
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "24h" }
      );
      res.send({ result, token });
    });

    // PUT Api for MyProfile.js:--
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          email: user.email,
          name: user.name,
          address: user.location,
          img: user.img,
          phone: user.phone,
          social: user.social,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);

      res.send({ result });
    });

    //PUT API to make User Admin:--------
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send({ result });
    });
    // GET api for checking Admin or NOT: useAdmin.js hooks---
    app.get("/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      // console.log({ email });
      const user = await userCollection.findOne({ email: email });
      // console.log(user);
      const isAdmin = user.role === "admin";

      res.send({ admin: isAdmin });
    });

    // GET API for finding All Orders ManageAllOrder.js:
    app.get("/user", verifyJWT, async (req, res) => {
      const prosucts = await userCollection.find().toArray();
      res.send(prosucts);
    });

    // GET API for finding All Products:
    app.get("/product", async (req, res) => {
      const prosucts = await productCollection.find().toArray();
      res.send(prosucts);
    });
    // GET API for finding All Reviews Review.js:
    app.get("/review", async (req, res) => {
      const prosucts = await reviewCollection.find().toArray();
      res.send(prosucts);
    });
    // GET API for perticular product:
    app.get("/product/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const queary = { _id: ObjectId(id) };
      const result = await productCollection.findOne(queary);
      res.send(result);
    });
    // GET Api for peticuler users by email for MyProfile.js:----
    app.get("/orders/:emil", async (req, res) => {
      const email = req.params.emil;
      const queary = { email: email };
      const result = await orderCollection.find(queary).toArray();
      res.send(result);
    });
    // GET API for finding All Orders ManageAllOrder.js:
    app.get("/orders", verifyJWT, async (req, res) => {
      const prosucts = await orderCollection.find().toArray();
      res.send(prosucts);
    });
    // POST api for Purchase.js Order:----
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    // POSt Api to AddProduct.js:--
    app.post("/product", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send({ result });
    });
    //POSt Api to AddReview.js:--
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send({ result });
    });

    // DELETE API FOR Perticuler Product: ManageProduct.js-------
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(filter);
      res.send(result);
    });
    // DELETE API FOR Perticuler Order: ManageOrder.js && MyOrder.js-------
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(filter);
      console.log(result);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From TOOLS menufecturer");
});

app.listen(port, () => {
  console.log(`Tools Producer app listening on port ${port}`);
});
