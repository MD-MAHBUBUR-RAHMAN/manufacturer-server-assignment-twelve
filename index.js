const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
// MiddleWare:-----
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6jc0n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("db connected");
    const productCollection = client.db("toolsManager").collection("products");
    const bookingCollection = client.db("toolsManager").collection("bookings");
    const userCollection = client.db("toolsManager").collection("users");

    // GET API for finding All Products:
    app.get("/product", async (req, res) => {
      const prosucts = await productCollection.find().toArray();
      res.send(prosucts);
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
