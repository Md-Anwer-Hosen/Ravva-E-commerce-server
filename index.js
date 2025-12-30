const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

//middleWere-->

app.use(cors());
app.use(express.json());

//Cloudinary-->>

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

//mongo -->>

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.stwfv7r.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const productCollection = client.db("ravvaDb").collection("products");
    const userCollections = client.db("ravvaDb").collection("users");

    //get all data-->>

    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //getData by id-->>

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    //post-->>

    app.post(
      "/products",
      upload.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "subImages", maxCount: 3 },
      ]),
      async (req, res) => {
        try {
          const mainImageFile = req.files.mainImage[0];
          const subImages = req.files.subImages;

          // upload main image
          const mainResult = await cloudinary.uploader.upload(
            `data:${
              mainImageFile.mimetype
            };base64,${mainImageFile.buffer.toString("base64")}`
          );

          // upload sub images
          const subImageUrls = [];
          for (let img of subImages) {
            const result = await cloudinary.uploader.upload(
              `data:${img.mimetype};base64,${img.buffer.toString("base64")}`
            );
            subImageUrls.push(result.secure_url);
          }

          const product = {
            ...req.body,
            mainImage: mainResult.secure_url,
            subImage: subImageUrls,
          };

          const result = await productCollection.insertOne(product);
          res.send(result);
        } catch (err) {
          res.status(500).send({ error: err.message });
        }
      }
    );

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is working ");
});

// app.listen(port, () => {
//   console.log("Server is working at :", port);
// });

module.exports = app;
