import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import signupModel from "../models/userModel.js";
import postModel from "../models/postModel.js";

describe("signupModel", () => {
  it("is registered under the Signup model name", () => {
    expect(signupModel.modelName).toBe("Signup");
  });

  it("hides the password by default", () => {
    expect(signupModel.schema.path("password").options.select).toBe(false);
    expect(signupModel.schema.path("email").options.unique).toBe(true);
  });

  it("keeps the user fields as strings", () => {
    const user = new signupModel({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "hashed",
    });

    expect(user.validateSync()).toBeUndefined();
    expect(user.firstName).toBe("Ada");
    expect(user.email).toBe("ada@example.com");
  });

  it("casts non-string values to strings and drops unknown fields", () => {
    const user = new signupModel({ firstName: 42, role: "admin" });

    expect(user.firstName).toBe("42");
    expect(user.role).toBeUndefined();
  });
});

describe("postModel", () => {
  it("is registered under the post model name", () => {
    expect(postModel.modelName).toBe("post");
  });

  it("exposes timestamps on the schema", () => {
    expect(postModel.schema.paths.createdAt).toBeDefined();
    expect(postModel.schema.paths.updatedAt).toBeDefined();
  });

  it("validates a post document", () => {
    const post = new postModel({
      post_title: "title 01",
      post_desc: "desc",
      author: new mongoose.Types.ObjectId(),
    });

    expect(post.validateSync()).toBeUndefined();
    expect(post.post_title).toBe("title 01");
    expect(post.post_desc).toBe("desc");
  });

  it("requires an author", () => {
    const post = new postModel({ post_title: "title 01" });

    expect(post.validateSync()?.errors.author).toBeDefined();
  });
});
