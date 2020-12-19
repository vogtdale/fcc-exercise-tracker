const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { json } = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));

//connect to mangooseDb
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log(mongoose.connection.readyState);

//create personSchema
const persSchema = new mongoose.Schema({
  username: { type: String, unique: true },
});
const Person = mongoose.model("Person", persSchema);

//Create Exercise schema
const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  console.log(req.body);
  const createPerson = new Person({ username: req.body.username });
  createPerson.save((err, data) => {
    if (!data) {
      res.json({ username: "Username is already taken" });
    } else {
      res.json({ username: data.username, _id: data.id });
    }
  });
});

app.post("/api/exercise/add", (req, res) => {
  console.log(req.body);
  let { userId, description, duration, date } = req.body;

  if (!date) {
    date = new Date();
  }

  Person.findById(userId, (err, data) => {
    if (!data) {
      res.json({ error: "Unknown userId" });
    } else {
      const username = data.username;
      let createNewExercice = new Exercise({
        userId,
        description,
        duration,
        date,
      });
      createNewExercice.save((err, data) => {
        res.json({
          username,
          description,
          duration: +duration,
          _id: userId,
          date: new Date(date).toString(),
        });
      });
    }
  });
});

app.get("/api/exercise/log", (req, res) => {
  console.log(req.query);
  const { userId, from, to, limit } = req.query;
  Person.findById(userId, (err, data) => {
    if (!data) {
      res.json({ error: "Unknow UserId" });
    } else {
      const username = data.username;
      console.log({ from: from, to: to, limit: limit });
      Exercise.find(
        { userId },
        { date: { $gte: new Date(from), $lte: new Date(to) } }
      )
        .select(["id", "description", "duration", "date"])
        .limit(+limit)
        .exec((err, data) => {
          let newData = data.map((exercise) => {
            let dateFormated = new Date(exercise.date).toString();
            return {
              id: exercise.id,
              description: exercise.description,
              duration: exercise.duration,
              date: dateFormated,
            };
          });
          if (!data) {
            res.json({
              userId: userId,
              username: username,
              count: 0,
              log: [],
            });
          } else {
            res.json({
              userId: userId,
              username: username,
              count: data.length,
              log: newData,
            });
          }
        });
    }
  });
});

app.get("/api/exercise/users", (req, res) => {
  Person.find({}, (err, data) => {
    if (!data) {
      res.send("No users");
    } else {
      res.json(data);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
