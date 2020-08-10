var express = require("express"); // The server module
var bodyparser = require("body-parser"); // Allows simple parsing of request body's
var session = require("express-session"); // Allows sessions
const { Pool } = require("pg"); // Postgres module
const handlebars = require("express-handlebars"); // Allows us to use templating

const connectionString =
  "postgres://mkgzmxfz:loV45Qk1P0veufFoUlxJcUdEx2XN46BO@drona.db.elephantsql.com:5432/mkgzmxfz";

// Sets up our application, with a bodyparser for reading response messages
var app = express();
app.use(bodyparser());
app.use(express.static("public"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  handlebars({
    layoutsDir: __dirname + "/views/layouts",
    extname: "hbs",
    helpers: {
      toJSON: function (object) {
        return JSON.stringify(object);
      },
    },
  })
);

// Sets up our port, our mongoURL, and the variable which will hold our database
const PORT = 9000;
// Gives us a dbclient, and connects that client to the database

const pool = new Pool({
  connectionString: connectionString,
  max: 5,
  idleTimeoutMillis: 1000,
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
  /* Need to render this page */
  res.sendFile(__dirname + "/public/dashboard/home.html");
});

app.post("/register.html", (req, res) => {
  /* 
  This function needs email verification"
  */
  pool
    .query("INSERT INTO users (email, password, name) VALUES ($1, $2, $3)", [
      req.body.inputEmail,
      req.body.inputPassword,
      req.body.inputName,
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
  pool
    .query("DELETE FROM classMembership WHERE userID = $1 AND classID = $2", [
      req.session.data.id,
      req.body.id,
    ])
    .then(() => {
      console.log("success");
      res.writeHead(302, { Location: "/dashboard/myClasses" });
      res.end();
    })
    .catch((err) => {
      console.log("Server Error");
      console.log(err);
      res.statusCode = 500;
      res.send("Server Error");
    });
});

app.get("/class", (req, res) => {
  res.render("class", { layout: "index" });
});

app.get("/class/*", (req, res) => {
  /* Need to redirect to an error page */
  var classID = req.originalUrl.split("/")[2]; // Class ID parameter
  var userID = req.session.data.id;
  pool
    .query(
      "SELECT users.id, users.email FROM users WHERE users.id IN (SELECT userID from classMembership WHERE classID = $1)",
      [classID]
    )
    .then((userData) => {
      pool
        .query(
          "SELECT * from classMeetings WHERE classId = $1 ORDER BY StartTime",
          [classID]
        )
        .then((meetingData) => {
          pool
            .query("SELECT * from classes WHERE id=$1", [classID])
            .then((classData) => {
              console.log(userData.rows);
              console.log(meetingData.rows);
              console.log(classData.rows);
              res.render("class", {
                layout: "index",
                users: userData.rows,
                meetings: meetingData.rows,
                class: classData.rows[0],
              });
            })
            .catch((err) => {
              throw err;
            });
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      console.log("SERVER ERROR");
      console.log(err);
      res.writeHead(302, { Location: "/dashboard/home" });
      res.end();
    });
});
