import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    post_title: String,
    post_desc: String,
  },
  { timestamps: true },
);

const postModel = mongoose.model("post", postSchema);

export default postModel;