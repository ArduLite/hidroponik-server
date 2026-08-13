const express = require("express");
const session = require("express-session");
const mysql = require("mysql2");
const multer = require("multer");
const dbConfig = require("./dbConfig");
const initMqtt = require("./mqtt");

const topikPompa = "hidroponik/8212817281/pompa";
const topikSetpoint = "hidroponik/8212817281/setpoint";

const USER = "admin";
const PASS = "12345678";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function initWeb(db, client) {
  const app = express();

  let nutrisi = 1200;
  const batas = 1000;

  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      secret: "hidroponik-session-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { maxAge: 60 * 60 * 1000 },
    })
  );

  app.set("view engine", "ejs");

  function requireLogin(req, res, next) {
    if (req.session.loggedIn) {
      next();
    } else {
      res.redirect("/login");
    }
  }

  app.get("/login", (req, res) => {
    if (req.session.loggedIn) {
      res.redirect("/");
      return;
    }
    res.render("login", { error: null });
  });

  app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === USER && password === PASS) {
      req.session.loggedIn = true;
      res.redirect("/");
    } else {
      res.render("login", { error: "Username atau password salah." });
    }
  });

  app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });

  app.get("/", requireLogin, (req, res) => {
    const msg = req.query.msg || null;
    db.query("SELECT * FROM data_sensor ORDER BY id DESC LIMIT 15", (err, result) => {
      res.render("index", {
        data: result,
        msg: msg,
      });
    });
  });

  app.post("/import", requireLogin, upload.single("sqlfile"), (req, res) => {
    if (!req.file) {
      return res.redirect("/?msg=nofile");
    }

    const sql = req.file.buffer.toString("utf8");

    const importDb = mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });

    importDb.query(sql, (err, result) => {
      importDb.end();
      if (err) {
        console.log("Import SQL gagal: " + err.message);
        return res.redirect("/?msg=fail");
      }
      console.log("Import SQL berhasil: " + JSON.stringify(result));
      res.redirect("/?msg=success");
    });
  });

  app.get("/data", requireLogin, (req, res) => {
    res.render("data", {
      status: "OFF",
      nutrisi: nutrisi,
    });
  });

  app.post("/publish", requireLogin, (req, res) => {
    const status = req.body.status;
    const aktuator = req.body.aktuator;

    client.publish(topikPompa, status);
    const query = "UPDATE list_aktuator SET status = ? WHERE nama = ? ";
    const values = [status, aktuator];

    db.query(query, values, (err, result) => {
      console.log(result);
      res.redirect('/');
    });

  });

  app.post("/setpoint", requireLogin, (req, res) => {
    const ppm = req.body.ppm;

    client.publish(topikSetpoint, String(ppm));
    console.log("Setpoint PPM dikirim: " + ppm + " ke topik " + topikSetpoint);
    res.redirect('/');
  });

  app.listen(3000);
}

module.exports = initWeb;
