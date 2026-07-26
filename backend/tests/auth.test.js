import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

vi.mock("../models/userModel.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../models/postModel.js", () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

const signupModel = (await import("../models/userModel.js")).default;
const app = (await import("../app.js")).default;

process.env.JWT_SECRET_KEY = "test-secret";

const validSignup = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "secret123",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/v1/signup", () => {
  it("creates a user with a hashed password", async () => {
    signupModel.findOne.mockResolvedValue(null);
    signupModel.create.mockImplementation(async (userObj) => ({
      _id: "user-1",
      ...userObj,
    }));

    const res = await request(app).post("/api/v1/signup").send(validSignup);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: "User created successfully",
      status: true,
    });
    expect(signupModel.findOne).toHaveBeenCalledWith({ email: validSignup.email });

    const savedUser = signupModel.create.mock.calls[0][0];
    expect(savedUser.password).not.toBe(validSignup.password);
    await expect(
      bcrypt.compare(validSignup.password, savedUser.password),
    ).resolves.toBe(true);
  });

  it.each(["firstName", "lastName", "email", "password"])(
    "returns 400 when %s is missing",
    async (field) => {
      const payload = { ...validSignup };
      delete payload[field];

      const res = await request(app).post("/api/v1/signup").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Required fields are missing...");
      expect(signupModel.create).not.toHaveBeenCalled();
    },
  );

  it("returns 400 when the body is empty", async () => {
    const res = await request(app).post("/api/v1/signup").send({});

    expect(res.status).toBe(400);
    expect(signupModel.findOne).not.toHaveBeenCalled();
  });

  it("returns 409 when the email already exists", async () => {
    signupModel.findOne.mockResolvedValue({ _id: "user-1", email: validSignup.email });

    const res = await request(app).post("/api/v1/signup").send(validSignup);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already exists..");
    expect(signupModel.create).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when persisting the user fails", async () => {
    signupModel.findOne.mockResolvedValue(null);
    signupModel.create.mockRejectedValue(new Error("db write failed"));

    const res = await request(app).post("/api/v1/signup").send(validSignup);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
    expect(console.error).toHaveBeenCalled();
  });

  it("never returns the stored password hash", async () => {
    signupModel.findOne.mockResolvedValue(null);
    signupModel.create.mockImplementation(async (userObj) => ({
      _id: "user-1",
      ...userObj,
    }));

    const res = await request(app).post("/api/v1/signup").send(validSignup);

    expect(JSON.stringify(res.body)).not.toContain("$2b$");
    expect(res.body.user).toEqual({
      id: "user-1",
      firstName: validSignup.firstName,
      lastName: validSignup.lastName,
      email: validSignup.email,
    });
  });
});

describe("POST /api/v1/login", () => {
  const buildUser = async () => ({
    _id: "user-1",
    email: validSignup.email,
    password: await bcrypt.hash(validSignup.password, 10),
  });

  it("returns a JWT that carries the id and email but no password", async () => {
    signupModel.findOne.mockResolvedValue(await buildUser());

    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: validSignup.email, password: validSignup.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");

    const payload = jwt.verify(res.body.token, "test-secret");
    expect(payload).toMatchObject({ id: "user-1", email: validSignup.email });
    expect(payload.password).toBeUndefined();
  });

  it.each(["email", "password"])("returns 400 when %s is missing", async (field) => {
    const payload = { email: validSignup.email, password: validSignup.password };
    delete payload[field];

    const res = await request(app).post("/api/v1/login").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Required fields are missing");
    expect(signupModel.findOne).not.toHaveBeenCalled();
  });

  it("returns 401 for an unknown email so it cannot be used to probe accounts", async () => {
    signupModel.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: "nobody@example.com", password: validSignup.password });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
    expect(res.body.token).toBeUndefined();
  });

  it("returns 401 for a wrong password", async () => {
    signupModel.findOne.mockResolvedValue(await buildUser());

    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: validSignup.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
    expect(res.body.token).toBeUndefined();
  });

  it("returns a generic 500 when the lookup fails", async () => {
    signupModel.findOne.mockRejectedValue(new Error("db read failed"));

    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: validSignup.email, password: validSignup.password });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
    expect(console.error).toHaveBeenCalled();
  });
});

describe("request level error handling", () => {
  it("returns 400 for a malformed JSON body", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .set("Content-Type", "application/json")
      .send("{not-json");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid JSON body");
  });

  it("returns a JSON 404 for an unknown route", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Route not found");
  });
});
