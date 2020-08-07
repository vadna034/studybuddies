var express = require("express");
var bodyparser = require("body-parser");
var fs = require("fs");
var session = require("express-session");
var crypto = require("crypto");
const { query } = require("express");
const { Pool, Client } = require("pg");
const connectionString =
  "postgres://mkgzmxfz:loV45Qk1P0veufFoUlxJcUdEx2XN46BO@drona.db.elephantsql.com:5432/mkgzmxfz";

// Sets up our application, with a bodyparser for reading response messages
var app = express();
app.use(bodyparser());
// Sets up our port, our mongoURL, and the variable which will hold our database
const PORT = 9001;
// Gives us a dbclient, and connects that client to the database

const pool = new Pool({
  connectionString: connectionString,
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
  pool
    .query("INSERT INTO users (email, password) VALUES ($1, $2)", [
      req.body.inputEmail,
      req.body.inputPassword,
    ])
    .then((result) => {
      console.log(result);
      res.statusCode = 200;
      res.send("Success");
    })
    .catch((err) => {
      if (err.code == 23505) {
        res.statudCode = 200;
        res.send("Email already registered");
      } else {
        res.statusCode = 200;
        res.send("Server Error");
      }
    });
});

app.post("/login.html", (req, res) => {
  var valuesOne = [req.body.inputEmail, req.body.inputPassword];
  var queryOne = "";
  pool.query(
    "SELECT * from users WHERE email = $1 AND password = $2",
    valuesOne,
    (err, result) => {
      if (err) {
        console.log(err.stack);
      } else if (result.rows.length == 0) {
        console.log("FAIL");
        res.statusCode = 403;
        res.sendFile(__dirname + "/public/login.html");
      } else {
        console.log("success");
        req.session.data = {};
        req.session.data.id = result.rows[0].id;
        req.session.data.email = result.rows[0].email;
        res.sendFile(__dirname + "/public/dashboard.html");
      }
    }
  );
});

app.post("/addClass", (req, res) => {
  // Post request used to add a class to the users datatbase entry
  // Just using /in makes this stuff work :3. For arrays,, you can just push
  // can use json.stringify on the object !

  var term = req.body.term;
  var code = req.body.dept + " " + req.body.classNumber;
  var section = req.body.classId;

  if (section === "") {
    section = "0";
  }

  var valuesOne = [term, code, section];
  console.log(valuesOne);
  var queryOne =
    "SELECT id FROM classes WHERE term = $1 AND code = $2 AND section = $3";
  pool.query(queryOne, valuesOne, (err, result) => {
    console.log(result);
    if (err) {
      console.log(err);
      res.statusCode = 409;
      res.send("Failed");
    } else {
      if (result.rows.length == 0) {
        console.log("No such class matches your query");
        res.statusCode = 403;
        res.send("");
      } else {
        var queryTwo = "INSERT INTO classMembership VALUES ($1, $2)";
        console.log(req.session.data.id, result.rows[0].id);
        pool.query(
          queryTwo,
          [req.session.data.id, result.rows[0].id],
          (err, result) => {
            if (err) {
              console.log(err);
              res.statusCode = 403;
            } else {
              console.log("success");
              res.statusCode = 200;
              res.sendFile(__dirname + "/public/dashboard/myClasses.html");
            }
          }
        );
      }
    }
  });
});

app.post("/getClasses", (req, res) => {
  var valuesOne = [req.session.inputEmail];
  var queryOne = "SELECT classid FROM classMembership WHERE userid.email = $1";
  pool.query(valuesOne, queryOne, (err, result) => {
    if (err) {
      console.log(error);
    } else {
      console.log(result);
      res.statusCode = 200;
      res.contentType = "text/html";
      res.send(JSON.stringify(result));
    }
  });
});

app.post("/deleteClass", (req, res) => {
  console.log("I got here");
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
});
