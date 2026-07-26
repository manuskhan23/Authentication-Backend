import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../models/postModel.js", () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock("../models/userModel.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

const postModel = (await import("../models/postModel.js")).default;
const app = (await import("../app.js")).default;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /", () => {
  it("responds with the health payload", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toBe("hello");
  });
});

describe("POST /api/createpost", () => {
  it("persists the request body and returns 201", async () => {
    const body = { post_title: "title 01", post_desc: "desc" };
    postModel.create.mockResolvedValue({ _id: "post-1", ...body });

    const res = await request(app).post("/api/createpost").send(body);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(body);
    expect(postModel.create).toHaveBeenCalledWith(body);
  });

  it("accepts urlencoded bodies", async () => {
    postModel.create.mockResolvedValue({ _id: "post-1" });

    const res = await request(app)
      .post("/api/createpost")
      .type("form")
      .send("post_title=title 01");

    expect(res.status).toBe(201);
    expect(postModel.create).toHaveBeenCalledWith({ post_title: "title 01" });
  });

  it("returns 500 when the write fails", async () => {
    postModel.create.mockRejectedValue(new Error("create failed"));

    const res = await request(app).post("/api/createpost").send({});

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("create failed");
  });
});

describe("GET /api/getpost", () => {
  it("returns the matching posts", async () => {
    const posts = [{ _id: "post-1", post_title: "title 01" }];
    postModel.find.mockResolvedValue(posts);

    const res = await request(app).get("/api/getpost");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(posts);
    expect(postModel.find).toHaveBeenCalledWith({ post_title: "title 01" });
  });

  it("returns 500 when the read fails", async () => {
    postModel.find.mockRejectedValue(new Error("find failed"));

    const res = await request(app).get("/api/getpost");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("find failed");
  });
});

describe("PUT /api/updatepost", () => {
  it("updates the post and confirms", async () => {
    postModel.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .put("/api/updatepost")
      .send({ post_title: "updated" });

    expect(res.status).toBe(200);
    expect(res.body).toBe("data updated successfully...");
    expect(postModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "69e482145220f13556b60d6c",
      { post_title: "updated" },
    );
  });

  it("returns 500 when the update fails", async () => {
    postModel.findByIdAndUpdate.mockRejectedValue(new Error("update failed"));

    const res = await request(app).put("/api/updatepost").send({});

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("update failed");
  });
});

describe("DELETE /api/deletepost/:id", () => {
  it("deletes the post referenced by the route param", async () => {
    postModel.findByIdAndDelete.mockResolvedValue({});

    const res = await request(app).delete("/api/deletepost/post-1");

    expect(res.status).toBe(200);
    expect(res.body).toBe("data deleted successfully...");
    expect(postModel.findByIdAndDelete).toHaveBeenCalledWith("post-1");
  });

  it("returns 500 when the delete fails", async () => {
    postModel.findByIdAndDelete.mockRejectedValue(new Error("delete failed"));

    const res = await request(app).delete("/api/deletepost/post-1");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("delete failed");
  });
});

describe("CORS", () => {
  it("allows the frontend origin with credentials", async () => {
    const res = await request(app).get("/").set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });
});
