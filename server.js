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
      isEmpty: function (arr) {
        return arr.length === 0;
      },
      if_all: function () {
        var args = [].slice.apply(arguments);
        var opts = args.pop();

        var fn = opts.fn;
        for (var i = 0; i < args.length; ++i) {
          if (args[i]) continue;
          fn = opts.inverse;
          break;
        }
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

app.use(function (req, res, next) {
  if (
    req.url === "/login" ||
    req.url === "/main.css" ||
    req.url === "/login.html" ||
    req.url === "/register" ||
    req.url === "/register.html" ||
    req.url === "/" ||
    req.url === "/index"
  ) {
    next();
  } else if (!req.session.data) {
    // check logged in status
    res.writeHead(302, { Location: "/" });
    res.end();
    // redirect to login page when not logged in
  } else {
    next();
  } // else just pass the request along
});

app.listen(process.env.PORT || PORT, () =>
  console.log("Listening on port " + PORT + "!")
);

app.use("/client", express.static(__dirname + "/public/client"));

app.get("/", (req, res) => {
  // Sends the user our index file
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/index", (req, res) => {
  // Sends the user our index file
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/login", (req, res) => {
  // Sends the user to our login page
  res.sendFile(__dirname + "/public/login.html");
});

app.get("/register", (req, res) => {
  // Sends register page
  res.sendFile(__dirname + "/public/register.html");
});

app.get("/main.css", (req, res) => {
  // Sends our CSS file
  res.sendFile(__dirname + "/css/main.css");
});

app.get("/dashboard/addClasses", (req, res) => {
  // Sends addClasses page
  res.sendFile(__dirname + "/public/dashboard/addClasses.html");
});

app.get("/dashboard/myClasses", (req, res) => {
  // Sends myClasses page
  res.sendFile(__dirname + "/public/dashboard/myClasses.html");
});

app.get("/dashboard/home", (req, res) => {
  // Sends user home page
  res.sendFile(__dirname + "/public/dashboard/home.html");
});

app.get("/dashboard/myMeetings", (req, res) => {
  // Sends user page to display meetings they are attending
  res.sendFile(__dirname + "/public/dashboard/myMeetings.html");
});

app.get("/dashboard/addMeetings", (req, res) => {
  // Sends user page to display meetings they are attending
  res.sendFile(__dirname + "/public/dashboard/addMeetings.html");
});

app.post("/addMeeting", async (req, res) => {
  var start = Date.parse(req.body.startdatetime) / 1000.0;
  var end = Date.parse(req.body.enddatetime) / 1000.0;

  console.log(req.body);

  console.log(start);
  console.log(end);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT into classmeetings (owner, classid, startTime, endTime, link, purpose) values ($1,$2,to_timestamp($3),to_timestamp($4),$5, $6) returning id",
      [
        req.session.data.id,
        req.body.classId,
        start,
        end,
        req.body.zoom,
        req.body.purpose,
      ]
    );
    console.log(result);
    await client.query(
      "INSERT INTO classmeetingmembership (userid, classmeetingid) values ($1, $2)",
      [req.session.data.id, result.rows[0].id]
    );
    await client.query("COMMIT");
    res.statusCode = 200;
    res.send("success");
    console.log("success");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.statusCode = 500;
    res.send("SERVER ERROR");
    console.log("fail");
  } finally {
    client.release();
  }
});

app.post("/register.html", (req, res) => {
  /* 
  This function needs email verification

  Lets users register for our site 
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
        res.statusCode = 200;
        res.send("Email already registered");
      } else {
        res.statusCode = 500;
        res.send("Server Error");
      }
    });
});

app.post("/login.html", (req, res) => {
  /*
  Lets users login to our site 
  */
  pool
    .query("SELECT * FROM users WHERE email = $1 AND password = $2", [
      req.body.inputEmail,
      req.body.inputPassword,
    ])
    .then((result) => {
      if (result.rows.length === 0) {
        // FAILURE: No user exists
        res.statusCode = 200;
        res.send("No user found");
      } else {
        // SUCCESS: Redirect to home page
        req.session.data = {};
        req.session.data.id = result.rows[0].id;
        req.session.data.email = result.rows[0].email;
        res.writeHead(302, { Location: "/dashboard/home" });
        res.end();
      }
    })
    .catch((err) => {
      // Failure: Generic failure on our end
      console.log(err);
      res.statusCode = 500;
      res.send("Server Error");
    });
});

app.post("/addClass", (req, res) => {
  // Used when a user wants to add a class to their list of classes
  console.log("/addClass");
  console.log(req.body);
  var term = req.body.term;
  var code = req.body.dept + " " + req.body.classNumber;

  pool
    .query(
      "INSERT INTO classMembership (userId, classId) VALUES ($1, (SELECT id FROM classes WHERE term =$2 AND code = $3))",
      [req.session.data.id, term, code]
    )
    .then((result) => {
      res.statusCode = 200;
      res.send("Success");
    })
    .catch((err) => {
      if (err.code == 23505) {
        res.statusCode = 200;
        res.send("Success");
      } else if (err.code == 23502) {
        res.statusCode = 404;
        res.send("Class does not exist");
      } else {
        res.statusCode = 500;
        console.log(err);
        res.send("Server Error");
      }
    });
});

app.post("/getClasses", (req, res) => {
  // Used to display classes that a user is attending
  pool
    .query(
      "SELECT C.id, C.term, C.code, C.name FROM classes AS C, classmembership AS CM WHERE CM.userid = $1 AND C.id = CM.classid",
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
  // Used to delete a class from a users list of classes
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

app.get("/dashboard/class/([0-9]+)", (req, res) => {
  // Displays a classes home page, with the meetings it has scheduled
  var classID = req.originalUrl.split("/")[3]; // Class ID parameter
  var userID = req.session.data.id;

  pool
    .query(
      "SELECT users.id, users.email, users.name FROM users WHERE users.id IN (SELECT userID from classMembership WHERE classID = $1)",
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
              curMeetings = meetingData.rows.filter(
                (meeting) =>
                  Date.parse(meeting.starttime) <= Date.now() &&
                  Date.parse(meeting.endtime) >= Date.now()
              );

              otherMeetings = meetingData.rows.filter(
                (meeting) => Date.parse(meeting.starttime) > Date.now()
              );

              res.render("class", {
                layout: "index",
                users: userData.rows,
                curMeetings: curMeetings,
                otherMeetings: otherMeetings,
                class: classData.rows[0],
                numberUsers: userData.rows.length,
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

app.post("/getMeetings", (req, res) => {
  // Gets all of the meetings that our user is attending
  pool
    .query(
      "SELECT CM.id, C.code, CM.startTime, CM.endTime, CM.purpose, CM.link, CM.owner FROM classes AS C, classmeetings AS CM, classmeetingmembership AS CMM WHERE CMM.userid = $1 AND CM.id = CMM.classmeetingid AND c.id = CM.classid ORDER BY CM.startTime",
      [req.session.data.id]
    )
    .then((data) => {
      // On success we send the user useful meeting data. This useful data is
      // Class code, startTime, endTime, meeting link, and owner (owner decides whether the user can delete the meeting)
      res.statusCode = 200;
      console.log(data.rows);
      var meetings = data.rows;
      meetings.forEach(
        // Tells us whether a user can delete a meeting, or if they can delete the meeting
        (meeting) => {
          meeting.delete = meeting.owner == req.session.data.id;
        }
      );
      res.send(JSON.stringify(meetings));
    })
    .catch((err) => {
      res.statusCode = 500;
      console.log("fail");
      res.send("SERVER ERROR");
    });
});

app.post("/deleteMeeting", (req, res) => {
  pool
    .query("DELETE FROM classMeetings WHERE id = $1", [req.body.id])
    .then(() => {
      res.statusCode = 200;
      res.send("SUCCESS");
    })
    .catch((err) => {
      console.log(err);
      res.statusCode = 500;
      res.send("SERVER ERROR");
    });
});

app.post("/leaveMeeting", (req, res) => {
  pool
    .query(
      "DELETE FROM classMeetingMembership WHERE classMeetingid = $1 AND userid = $2",
      [req.body.id, req.session.data.id]
    )
    .then(() => {
      res.statusCode = 200;
      res.send("SUCCESS");
    })
    .catch((err) => {
      console.log(err);
      res.statusCode = 500;
      res.send("SERVER ERROR");
    });
});

app.get("*", (req, res) => {
  console.log(req.url);
  res.statusCode = 404;
  res.send("NOT FOUND");
});
