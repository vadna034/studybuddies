var express = require("express"); // The server module
var bodyparser = require("body-parser"); // Allows simple parsing of request body's
var session = require("express-session"); // Allows sessions
const crypto = require("crypto");
const { Pool } = require("pg"); // Postgres module
const handlebars = require("express-handlebars"); // Allows us to use templating
const jwt = require("jsonwebtoken");
const moment = require("moment");
var nodemailer = require("nodemailer");
const { Console } = require("console");
require("dotenv").config({ path: __dirname + "/.env" });

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Sets up our application, with a bodyparser for reading response messages
var app = express();
app.use(bodyparser());
app.use(express.json());
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
      format_time: function (dateString) {
        const format1 = "h:mm a ";
        return moment.utc(Date.parse(dateString)).local().format(format1);
      },
      format_date: function (dateString) {
        const format1 = "MMMM Do ";
        return moment.utc(Date.parse(dateString)).local().format(format1);
      },
    },
  })
);

const pool = new Pool({
  connectionString: process.env.connectionString,
  max: parseInt(process.env.maxConnections),
  idleTimeoutMillis: parseInt(process.env.idleTimeoutMillis),
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
  })
);

app.use(function (req, res, next) {
  if (
    req.url === "/login" ||
    req.url === "/register" ||
    req.url === "/index" ||
    req.url === "/register.js" ||
    req.url === "/login.js" ||
    req.url === "/main.css" ||
    req.url.split("/")[1] === "confirmation"
  ) {
    next();
  } else if (req.session.data === undefined) {
    // check logged in status
    res.writeHead(302, { Location: "/index" });
    res.end();
    // redirect to login page when not logged in
  } else {
    console.log(req.url);
    next();
  } // else just pass the request along
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Listening on port " + process.env.PORT + "!")
);

app.use("/client", express.static(__dirname + "/public/client"));

app.get("/", (req, res) => {
  res.writeHead(302, { Location: "/dashboard/home" });
  res.end();
});

app.get("/index", (req, res) => {
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
  console.log(req.body);
  var start = Date.parse(req.body.startdatetime) / 1000.0;
  var end = Date.parse(req.body.enddatetime) / 1000.0;

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

app.post("/login", (req, res) => {
  /*
  Lets users login to our site 
  */
  console.log(req.body);
  pool
    .query(
      "SELECT * FROM users WHERE email = $1 AND password = crypt($2, password)",
      [req.body.inputEmail, req.body.inputPassword]
    )
    .then((result) => {
      console.log(result.rows);
      if (!result.rows[0] || !result.rows[0].isconfirmed) {
        // FAILURE: No user exists
        console.log("No user found");
        res.status(404).send("No user found");
      } else {
        // SUCCESS: Redirect to home page
        console.log("successful login");
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

app.get("/dashboard/class/([0-9]+)", async (req, res) => {
  // Displays a classes home page, with the meetings it has scheduled
  console.log("here");
  var classID = req.originalUrl.split("/")[3]; // Class ID parameter
  var userID = req.session.data.id;

  try {
    var classData = await pool
      .query("SELECT * from classes WHERE id=$1", [classID])
      .catch((err) => {
        throw err;
      });
    var userData = await pool
      .query(
        "SELECT users.id, users.email FROM users, classmembership WHERE classmembership.classid = $1 AND  users.id = classmembership.userid",
        [classID]
      )
      .catch((err) => {
        console.log("Failed selecting users");
        throw err;
      });
    var userMeetings = await pool
      .query(
        "SELECT U.email, CM.owner, CM.starttime, CM.endtime, CM.link, CM.purpose, CM.id, (case when exists (SELECT userid from classmeetingmembership WHERE classmeetingid = CM.id AND userid = $2) then True else False end) AS enrolled from classMeetings AS CM, users as U WHERE CM.classId = $1 AND U.id = CM.owner ORDER BY CM.StartTime ",
        [classID, req.session.data.id]
      )
      .catch((err) => {
        console.log("Failed selecting meetings");
        throw err;
      });

    userMeetings = userMeetings.rows;
    console.log(userMeetings);

    userMeetings.forEach(
      (meeting) => (meeting.delete = meeting.owner == req.session.data.id)
    );
    var userMeetingsData = userMeetings.filter((meeting) => meeting.enrolled);
    var nonUserMeetingsData = userMeetings.filter(
      (meeting) => !meeting.enrolled
    );

    res.render("class", {
      layout: "index",
      users: userData.rows,
      userMeetings: userMeetingsData,
      nonUserMeetings: nonUserMeetingsData,
      class: classData.rows[0],
      numberUsers: userData.rows.length,
    });
  } catch (err) {
    console.log("SERVER ERROR");
    console.log(err);
    res.writeHead(500, { Location: "/status/500.html" });
    res.end();
  }
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
      res.writeHead(302, { Location: "/dashboard/myMeetings" });
      res.end();
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
      res.writeHead(302, { Location: "/dashboard/myMeetings" });
      res.end();
    })
    .catch((err) => {
      console.log(err);
      res.statusCode = 500;
      res.send("SERVER ERROR");
    });
});

app.post("/joinMeeting", (req, res) => {
  pool
    .query(
      "INSERT INTO classMeetingMembership (classMeetingid, userid) VALUES ($1, $2)",
      [req.body.id, req.session.data.id]
    )
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log(err);
      res.statusCode = 500;
      res.send("SERVER ERROR");
    });
});

app.get("/addClasses.js", (req, res) => {
  res.statusCode = 200;
  res.sendFile(__dirname + "/src/addClasses.js");
});

app.get("/home.js", (req, res) => {
  res.statusCode = 200;
  res.sendFile(__dirname + "/src/home.js");
});

app.get("/addMeetings.js", (req, res) => {
  res.statusCode = 200;
  res.sendFile(__dirname + "/src/addMeetings.js");
});

app.get("/myClasses.js", (req, res) => {
  res.statusCode = 200;
  res.sendfile(__dirname + "/src/myClasses.js");
});

app.get("/myMeetings.js", (req, res) => {
  res.statusCode = 200;
  res.sendFile(__dirname + "/src/myMeetings.js");
});

app.get("/login.js", (req, res) => {
  res.statusCode = 200;
  res.sendFile(__dirname + "/src/login.js");
});

app.get("/register.js", (req, res) => {
  res.statusCode = 200;
  res.sendFile(__dirname + "/src/register.js");
});

app.get("/dashboard.js", (req, res) => {
  res.statusCode = 200;
  res.sendFile(__dirname + "/src/dashboard.js");
});

app.get("/class.js", (req, res) => {
  res.status(200).sendFile(__dirname + "/src/class.js");
});

app.post("/register", async (req, res) => {
  //inputEmail, inputPassword are sent
  const email = req.body.inputEmail;
  const password = req.body.inputPassword;
  const isConfirmed = "false";
  const random = crypto.randomBytes(64).toString("hex");
  const expireDate = Date.now() + 1 * 60 * 60 * 1000;
  const accessToken = jwt.sign(
    { email: req.body.inputEmail, expireDate: expireDate, random: random },
    process.env.ACCESS_TOKEN_SECRET
  );

  var mailOptions = {
    from: process.env["EMAIL_USER"],
    to: email,
    subject: "Account Verification Link",
    text:
      "Hello,\n\n" +
      "Please verify your account by clicking the link: \nhttp://" +
      req.headers.host +
      "/confirmation/" +
      accessToken +
      "\n\nThis link will be valid for the next hour",
  };

  try {
    const result = await pool.query(
      "SELECT isconfirmed FROM users where email = $1",
      [email]
    );
    console.log(result.rows);
    if (result.rows[0] && result.rows[0].isconfirmed) {
      res.sendStatus(409);
    } else if (result.rows[0]) {
      await pool
        .query(
          "UPDATE users SET password = crypt($2, gen_salt('bf')), random = $3 WHERE email = $1",
          [email, password, random]
        )
        .then(() => console.log("UPDATE success"))
        .catch((err) => {
          console.log("UPDATE failed");
          throw err;
        });
    } else {
      await pool
        .query(
          "INSERT INTO users (email, password, isconfirmed, random) values ($1, crypt($2, gen_salt('bf')), $3, $4)",
          [email, password, false, random]
        )
        .then(() => console.log("INSERT success"))
        .catch((err) => {
          console.log("INSERT failed");
          throw err;
        });
    }

    transporter.sendMail(mailOptions).then(() => res.sendStatus(200));
  } catch (err) {
    console.log(err);
    res.statusCode = 500;
    res.send("SERVER ERROR");
    console.log("fail");
  }
});

function authenticateToken(req, res, next) {
  const token = req.params.token;

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, token) => {
    if (err) return res.sendStatus(403);
    if (token.expireDate < Date.now()) return res.sendStatus(401);
    req.token = token;
    next();
  });
}

app.get("/confirmation/:token", authenticateToken, (req, res) => {
  console.log(req.params);
  console.log(req.token);
  pool
    .query(
      "update users set isconfirmed = true where email = $1 AND random=$2 returning id",
      [req.token.email, req.token.random]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        res.status(401).sendFile(__dirname + "/public/status/401.html");
      } else {
        res.status(200).sendFile(__dirname + "/public/status/200.html");
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).sendFile(__dirname + "/public/status/500.html");
    });
});

app.get("/success", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.get("*", (req, res) => {
  res.status(404).sendFile(__dirname + "/public/status/404.html");
});
