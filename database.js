const mysql = require("mysql2");
const dbConfig = require("./dbConfig");

const db = mysql.createConnection(dbConfig);

module.exports = db;