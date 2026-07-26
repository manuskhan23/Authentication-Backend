import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    post_title: { type: String, required: true, trim: true, maxlength: 200 },
    post_desc: { type: String, trim: true, maxlength: 5000 },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Signup",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

const postModel = mongoose.model("post", postSchema);

export default postModel;
