var express = require("express");
var bodyparser = require("body-parser");
var fs = require("fs");
var session = require("express-session");
var crypto = require("crypto");
const { query } = require("express");
const { Pool, Client } = require("pg");
var hbs = require("express-handlebars");
const connectionString =
  "postgres://mkgzmxfz:loV45Qk1P0veufFoUlxJcUdEx2XN46BO@drona.db.elephantsql.com:5432/mkgzmxfz";

// Sets up our application, with a bodyparser for reading response messages
var app = express();
app.use(bodyparser());
// Sets up our port, our mongoURL, and the variable which will hold our database
const PORT = 9000;
// Gives us a dbclient, and connects that client to the database

// view engine setup
app.set("view engine", "hbs");

app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultView: "default",
    layoutsDir: __dirname + "/views/pages/",
    partialsDir: __dirname + "/views/partials/",
  })
);

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
  /* 
  This function needs email verification"
  */
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
  /*
  Good
  */
  pool
    .query("SELECT * FROM users WHERE email = $1 AND password = $2", [
      req.body.inputEmail,
      req.body.inputPassword,
    ])
    .then((result) => {
      if (result.rows.length === 0) {
        res.statusCode = 200;
        res.send("No user found");
      } else {
        req.session.data = {};
        req.session.data.id = result.rows[0].id;
        req.session.data.email = result.rows[0].email;
        res.writeHead(302, { Location: "/dashboard/home" });
        res.end();
      }
    })
    .catch((err) => {
      console.log(err);
      res.statusCode = 500;
      res.send("Server Error");
    });
});

app.post("/addClass", (req, res) => {
  var term = req.body.term;
  var code = req.body.dept + " " + req.body.classNumber;
  var section = req.body.classId;

  if (section === "") {
    section = "0";
  }

  console.log(req.session.data);

  pool
    .query(
      "INSERT INTO classMembership (userId, classId) VALUES ($1, (SELECT id FROM classes WHERE term =$2 AND code = $3 AND section = $4))",
      [req.session.data.id, term, code, section]
    )
    .then((result) => {
      res.statusCode = 200;
      res.send("Success");
    })
    .catch((err) => {
      if (err.code == 23505) {
        res.statusCode = 200;
        res.send("Already registered");
      } else if (err.code == 23502) {
        res.statusCode = 200;
        res.send("Class does not exist");
      } else {
        res.statusCode = 500;
        res.send("Server Error");
      }
    });
});

app.post("/getClasses", (req, res) => {
  pool
    .query(
      "SELECT * from classes WHERE id IN (SELECT classId FROM classMembership WHERE userId = $1)",
      [req.session.data.id]
    )
    .then((result) => {
      res.statusCode = 200;
      console.log(result.rows);
      console.log(JSON.stringify(result.rows));
      res.send(JSON.stringify(result.rows));
    })
    .catch((err) => {
      res.statusCode = 500;
      console.log(err);
      res.send("");
      console.log("Server Error");
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
