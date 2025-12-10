const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

const DEFAULT_DB_NAME = process.env.MONGO_DB_NAME || "CMSC335DB";
const DEFAULT_COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || "moviesCollection";

const ensureMongoUri = (uri) => {
   if (!uri) {
      throw new Error("Missing MONGO_CONNECTION_STRING environment variable");
   }
   return uri;
};

const createClient = (uri) => new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

const buildApp = ({ mongoUri = process.env.MONGO_CONNECTION_STRING, dbName = DEFAULT_DB_NAME, collectionName = DEFAULT_COLLECTION_NAME } = {}) => {
   const uri = ensureMongoUri(mongoUri);
   const app = express();

   app.use(bodyParser.urlencoded({ extended: false }));
   app.set("view engine", "ejs");
   app.set("views", path.resolve(__dirname, "templates"));

   const withMongo = async (res, callback) => {
      const client = createClient(uri);
      try {
         await client.connect();
         const collection = client.db(dbName).collection(collectionName);
         return await callback(collection);
      } catch (error) {
         console.error(error);
         res.status(500).send("Server error");
      } finally {
         await client.close();
      }
   };

   app.get("/", (req, res) => {
      res.send("My Deployment");
   });

   app.get("/insertMovies", async (req, res) => {
      await withMongo(res, async (collection) => {
         const moviesArray = [
            { name: "Batman", year: 2021, stars: 1.5 },
            { name: "Wonder Women", year: 2005, stars: 2.0 },
            { name: "When Harry Met Sally", year: 1985, stars: 5 },
            { name: "Hulk", year: 1985, stars: 5 },
         ];
         const result = await collection.insertMany(moviesArray);
         const inserted = Object.values(result.insertedIds || {}).length;
         res.send(`<h2>Inserted ${inserted} movies</h2>`);
      });
   });

   app.get("/listMovies", async (req, res) => {
      await withMongo(res, async (collection) => {
         const cursor = collection.find({});
         const result = await cursor.toArray();
         const answer = result.reduce((acc, elem) => acc + `${elem.name} (${elem.year})<br>`, "");
         res.send(`${answer}Found: ${result.length} movies`);
      });
   });

   app.get("/clearCollection", async (req, res) => {
      await withMongo(res, async (collection) => {
         await collection.deleteMany({});
         res.send("<h2>Collection Cleared</h2>");
      });
   });

   app.get("/getSummary", (req, res) => {
      const variables = { year: 2025 };
      res.render("summary", variables);
   });

   app.get("/health", (req, res) => {
      res.json({ status: "ok" });
   });

   return app;
};

if (require.main === module) {
   const port = process.env.PORT || 7003;
   const app = buildApp();
   app.listen(port, () => {
      console.log(`main URL http://localhost:${port}/`);
   });
}

module.exports = { buildApp };
