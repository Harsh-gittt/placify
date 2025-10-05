const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const BookmarkSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", index: true, required: true },
    internshipId: { type: String, required: true },
    title: String,
    company: String,
    logo: String,
    location: String,
    remote: Boolean,
    stipend: String,
    duration: String,
    posted_at: Date,
    url: String,
    source: String,
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, internshipId: 1 }, { unique: true });

const userModel = model("User", UserSchema);
const bookmarkModel = model("Bookmark", BookmarkSchema);
module.exports = { userModel, bookmarkModel };
