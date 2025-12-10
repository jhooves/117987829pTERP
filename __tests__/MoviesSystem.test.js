const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { buildApp } = require("../MoviesSystem");

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  app = buildApp({ mongoUri, dbName: "TestDB", collectionName: "moviesCollection" });
});

beforeEach(async () => {
  await request(app).get("/clearCollection").expect(200);
});

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test("inserts four movies", async () => {
  const res = await request(app).get("/insertMovies").expect(200);
  expect(res.text).toMatch(/Inserted 4 movies/);
});

test("lists inserted movies", async () => {
  await request(app).get("/insertMovies").expect(200);
  const res = await request(app).get("/listMovies").expect(200);
  expect(res.text).toContain("Batman (2021)");
  expect(res.text).toContain("Found: 4 movies");
});

test("clears the collection", async () => {
  await request(app).get("/insertMovies").expect(200);
  await request(app).get("/clearCollection").expect(200);
  const res = await request(app).get("/listMovies").expect(200);
  expect(res.text).toContain("Found: 0 movies");
});
