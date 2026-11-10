require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Fridge ka design: har todo mein title aur done hoga
const Todo = mongoose.model("Todo", {
  title: String,
  done: { type: Boolean, default: false },
});

// Saare todos dikhao
app.get("/todos", async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

// Naya todo add karo
app.post("/todos", async (req, res) => {
  const todo = await Todo.create({ title: req.body.title });
  res.json(todo);
});

// Todo delete karo
app.delete("/todos/:id", async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: "Delete ho gaya" });
});
// Todo ko done / not done karo
app.put("/todos/:id", async (req, res) => {
  const todo = await Todo.findById(req.params.id);
  todo.done = !todo.done;
  await todo.save();
  res.json(todo);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connect ho gaya ✅"))
  .catch((err) => console.log("Error:", err.message));

app.listen(5000, () => console.log("Server chal raha hai port 5000 par"));