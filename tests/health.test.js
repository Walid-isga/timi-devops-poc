const request = require("supertest");
const app = require("../app/server");

describe("GET /health", () => {
  it("renvoie status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
