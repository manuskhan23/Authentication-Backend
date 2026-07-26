import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../models/postModel.js", () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

vi.mock("../models/userModel.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

process.env.JWT_SECRET = "test-secret";

const postModel = (await import("../models/postModel.js")).default;
const app = (await import("../app.js")).default;

const USER_ID = "69e482145220f13556b60d6c";
const OTHER_ID = "69e482145220f13556b60d6d";
const token = jwt.sign({ id: USER_ID, email: "ada@example.com" }, "test-secret", {
  expiresIn: "1h",
});
const auth = (req) => req.set("Authorization", `Bearer ${token}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /", () => {
  it("responds with the health payload", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("authentication", () => {
  it.each([
    ["post", "/api/createpost"],
    ["get", "/api/getpost"],
    ["put", `/api/updatepost/${OTHER_ID}`],
    ["delete", `/api/deletepost/${OTHER_ID}`],
  ])("rejects unauthenticated %s %s", async (method, path) => {
    const res = await request(app)[method](path);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Authentication required");
    expect(postModel.create).not.toHaveBeenCalled();
    expect(postModel.find).not.toHaveBeenCalled();
    expect(postModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(postModel.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("rejects a token signed with the wrong secret", async () => {
    const forged = jwt.sign({ id: USER_ID }, "not-the-secret");

    const res = await request(app)
      .get("/api/getpost")
      .set("Authorization", `Bearer ${forged}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired token");
  });

  it("rejects an expired token", async () => {
    const expired = jwt.sign({ id: USER_ID }, "test-secret", { expiresIn: -10 });

    const res = await request(app)
      .get("/api/getpost")
      .set("Authorization", `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/createpost", () => {
  it("persists whitelisted fields owned by the caller", async () => {
    postModel.create.mockImplementation(async (doc) => ({ _id: "post-1", ...doc }));

    const res = await auth(request(app).post("/api/createpost")).send({
      post_title: "title 01",
      post_desc: "desc",
    });

    expect(res.status).toBe(201);
    expect(postModel.create).toHaveBeenCalledWith({
      post_title: "title 01",
      post_desc: "desc",
      author: USER_ID,
    });
  });

  it("ignores an author supplied by the client", async () => {
    postModel.create.mockResolvedValue({ _id: "post-1" });

    await auth(request(app).post("/api/createpost")).send({
      post_title: "title 01",
      author: OTHER_ID,
      _id: "attacker-chosen",
    });

    expect(postModel.create).toHaveBeenCalledWith({
      post_title: "title 01",
      post_desc: "",
      author: USER_ID,
    });
  });

  it("accepts urlencoded bodies", async () => {
    postModel.create.mockResolvedValue({ _id: "post-1" });

    const res = await auth(request(app).post("/api/createpost"))
      .type("form")
      .send("post_title=title 01");

    expect(res.status).toBe(201);
  });

  it("returns 400 when post_title is missing", async () => {
    const res = await auth(request(app).post("/api/createpost")).send({});

    expect(res.status).toBe(400);
    expect(postModel.create).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when the write fails", async () => {
    postModel.create.mockRejectedValue(new Error("create failed"));

    const res = await auth(request(app).post("/api/createpost")).send({
      post_title: "title 01",
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});

describe("GET /api/getpost", () => {
  it("returns only the caller's posts", async () => {
    const posts = [{ _id: "post-1", post_title: "title 01" }];
    postModel.find.mockResolvedValue(posts);

    const res = await auth(request(app).get("/api/getpost"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(posts);
    expect(postModel.find).toHaveBeenCalledWith({ author: USER_ID });
  });

  it("returns a generic 500 when the read fails", async () => {
    postModel.find.mockRejectedValue(new Error("find failed"));

    const res = await auth(request(app).get("/api/getpost"));

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});

describe("PUT /api/updatepost/:id", () => {
  it("updates a post scoped to the caller", async () => {
    postModel.findOneAndUpdate.mockResolvedValue({ _id: OTHER_ID, post_title: "updated" });

    const res = await auth(request(app).put(`/api/updatepost/${OTHER_ID}`)).send({
      post_title: "updated",
    });

    expect(res.status).toBe(200);
    expect(postModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: OTHER_ID, author: USER_ID },
      { post_title: "updated" },
      { new: true, runValidators: true },
    );
  });

  it("returns 404 when the post belongs to someone else", async () => {
    postModel.findOneAndUpdate.mockResolvedValue(null);

    const res = await auth(request(app).put(`/api/updatepost/${OTHER_ID}`)).send({
      post_title: "updated",
    });

    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const res = await auth(request(app).put("/api/updatepost/not-an-id")).send({});

    expect(res.status).toBe(400);
    expect(postModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when the update fails", async () => {
    postModel.findOneAndUpdate.mockRejectedValue(new Error("update failed"));

    const res = await auth(request(app).put(`/api/updatepost/${OTHER_ID}`)).send({});

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});

describe("DELETE /api/deletepost/:id", () => {
  it("deletes a post scoped to the caller", async () => {
    postModel.findOneAndDelete.mockResolvedValue({ _id: OTHER_ID });

    const res = await auth(request(app).delete(`/api/deletepost/${OTHER_ID}`));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("data deleted successfully...");
    expect(postModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: OTHER_ID,
      author: USER_ID,
    });
  });

  it("returns 404 when the post belongs to someone else", async () => {
    postModel.findOneAndDelete.mockResolvedValue(null);

    const res = await auth(request(app).delete(`/api/deletepost/${OTHER_ID}`));

    expect(res.status).toBe(404);
  });

  it("returns a generic 500 when the delete fails", async () => {
    postModel.findOneAndDelete.mockRejectedValue(new Error("delete failed"));

    const res = await auth(request(app).delete(`/api/deletepost/${OTHER_ID}`));

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});

describe("CORS", () => {
  it("allows the frontend origin with credentials", async () => {
    const res = await request(app).get("/").set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not reflect an unlisted origin", async () => {
    const res = await request(app).get("/").set("Origin", "http://evil.example");

    expect(res.headers["access-control-allow-origin"]).not.toBe("http://evil.example");
  });
});
