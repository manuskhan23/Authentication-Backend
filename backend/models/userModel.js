import mongoose from "mongoose";

const signupSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    }
})

const signupModel = mongoose.model("Signup", signupSchema);

export default signupModel;