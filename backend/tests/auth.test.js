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
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

process.env.JWT_SECRET = "test-secret";
process.env.AUTH_RATE_LIMIT = "1000";

const signupModel = (await import("../models/userModel.js")).default;
const app = (await import("../app.js")).default;

const validSignup = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "secret123",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/signup", () => {
  it("creates a user with a hashed password and never echoes it back", async () => {
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
      user: {
        id: "user-1",
        firstName: validSignup.firstName,
        lastName: validSignup.lastName,
        email: validSignup.email,
      },
    });
    expect(JSON.stringify(res.body)).not.toContain("$2b$");
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

  it("rejects a malformed email", async () => {
    const res = await request(app)
      .post("/api/v1/signup")
      .send({ ...validSignup, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid email address");
    expect(signupModel.create).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/v1/signup")
      .send({ ...validSignup, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password must be at least 8 characters");
    expect(signupModel.create).not.toHaveBeenCalled();
  });

  it("returns 409 when the email already exists", async () => {
    signupModel.findOne.mockResolvedValue({ _id: "user-1", email: validSignup.email });

    const res = await request(app).post("/api/v1/signup").send(validSignup);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already exists..");
    expect(signupModel.create).not.toHaveBeenCalled();
  });

  it("returns 409 when the unique index rejects a concurrent signup", async () => {
    signupModel.findOne.mockResolvedValue(null);
    signupModel.create.mockRejectedValue(Object.assign(new Error("dup"), { code: 11000 }));

    const res = await request(app).post("/api/v1/signup").send(validSignup);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already exists..");
  });

  it("returns a generic 500 without leaking the internal error", async () => {
    signupModel.findOne.mockResolvedValue(null);
    signupModel.create.mockRejectedValue(new Error("db write failed"));

    const res = await request(app).post("/api/v1/signup").send(validSignup);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});

describe("POST /api/v1/login", () => {
  const buildUser = async () => ({
    _id: "user-1",
    email: validSignup.email,
    password: await bcrypt.hash(validSignup.password, 10),
  });

  it("returns an expiring JWT that carries the id and email but no password", async () => {
    signupModel.findOne.mockResolvedValue(await buildUser());

    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: validSignup.email, password: validSignup.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(signupModel.findOne).toHaveBeenCalledWith(
      { email: validSignup.email },
      "+password",
    );

    const payload = jwt.verify(res.body.token, "test-secret");
    expect(payload).toMatchObject({ id: "user-1", email: validSignup.email });
    expect(payload.password).toBeUndefined();
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it.each(["email", "password"])("returns 400 when %s is missing", async (field) => {
    const payload = { email: validSignup.email, password: validSignup.password };
    delete payload[field];

    const res = await request(app).post("/api/v1/login").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Required fields are missing");
    expect(signupModel.findOne).not.toHaveBeenCalled();
  });

  it("rejects a Mongo operator supplied instead of an email", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: { $ne: null }, password: validSignup.password });

    expect(res.status).toBe(400);
    expect(signupModel.findOne).not.toHaveBeenCalled();
  });

  it("returns 401 for an unknown email, matching the wrong-password response", async () => {
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
  });
});
