var express = require("express");
var bodyparser = require("body-parser");
var fs = require("fs");
var session = require("express-session");
var crypto = require("crypto");
var db = require("mongodb");
const { MongoClient } = require("mongodb");

// Sets up our application, with a bodyparser for reading response messages
var app = express();
app.use(bodyparser());
// Sets up our port, our mongoURL, and the variable which will hold our database
const PORT = 9005;
const mongoURL =
  "mongodb+srv://shane:Mark_Kelsey_Rae123@users-byzip.mongodb.net/Users?retryWrites=true&w=majority";
var db = null;
// Gives us a dbclient, and connects that client to the database

MongoClient.connect(mongoURL, (err, client) => {
  if (err) console.error(err);
  db = client.db("users");
});

app.use(
  session({
    secret: "b43920",
    saveUninitialized: true,
    resave: false,
  })
);

app.listen(process.env.PORT || PORT, () =>
  console.log("Listening on port " + PORT + "!")
);

app.use("/client", express.static(__dirname + "/public/client"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/index", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/public/register.html");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard.html");
});

app.get("/main.css", (req, res) => {
  res.sendFile(__dirname + "/css/main.css");
});

app.get("/dashboard/addClasses", (req, res) => {
  console.log("SENDING");
  res.sendFile(__dirname + "/public/dashboard/addClasses.html");
});

app.get("/dashboard/myClasses", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard/myClasses.html");
});

app.get("/dashboard/myGroups", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard/myGroups.html");
});

app.get("/dashboard/profile", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard/profile.html");
});

app.get("/dashboard/home", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard/home.html");
});

app.post("/register.html", (req, res) => {
  var body = req.body;
  console.log(body);

  db.collection("users")
    .find({
      $or: [{ username: body.inputUsername }, { email: body.inputEmail }],
    })
    .toArray((err, docs) => {
      if (err) {
        console.error(err);
      }

      if (docs.length == 0) {
        console.log("Success");
        db.collection("users").insertOne(
          {
            username: body.inputUsername,
            email: body.inputEmail,
            password: body.inputPassword,
            classes: [],
          },
          (err, docs) => {
            if (err) {
              console.error(err);
            }
          }
        );
        res.statusCode = 200;
        res.sendFile(__dirname + "/public/login.html");
      } else {
        console.log("Fail");
        res.statusCode = 403;
        res.sendFile(__dirname + "/public/register.html");
      }
    });
});

app.post("/login.html", (req, res) => {
  var body = req.body;
  console.log(body);

  var query = {
    $and: [{ email: body.inputEmail }, { password: body.inputPassword }],
  };

  db.collection("users")
    .find(query)
    .toArray((err, docs) => {
      if (err) {
        console.error(err);
      }

      if (docs.length == 0) {
        console.log("Fail");
        res.statusCode = 403;
        res.sendFile(__dirname + "/public/login.html");
      } else {
        console.log("success");
        console.log(docs[0]);
        req.session.id = docs[0]._id;
        req.session.email = docs[0].email;
        req.session.username = docs[0].username;
        res.sendFile(__dirname + "/public/dashboard.html");
      }
    });
});

app.post("/addClass", (req, res) => {
  // Post request used to add a class to the users datatbase entry
  // Just using /in makes this stuff work :3. For arrays,, you can just push
  // can use json.stringify on the object !

  var body = req.body;
  var entry_one = {
    term: body.term,
    dept: body.dept,
    classNum: body.classNumber,
    classId: body.classId,
  };

  var entry_two = {
    term: body.term,
    dept: body.dept,
    classNum: body.classNumber,
    classId: "",
  };

  db.collection("users").updateOne(
    { username: req.session.username },
    { $addToSet: { classes: { $each: [entry_one, entry_two] } } },
    function (err, result) {
      if (err) {
        console.error(err);
      }
      res.statusCode = 200;
      res.sendFile(__dirname + "/public/dashboard/addClasses.html");
    }
  );
});
