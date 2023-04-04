const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { reset } = require("nodemon");
const RouterData = require("./routers/routes");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");

const app = express();
// Global middleware
// secure http header using helmet
app.use(helmet());
// limit request from same API
const limiter = rateLimit({
  max: 1, // no. of requests
  windowMs: 60 * 60 * 1000, //time limit
  message: "Too many request from this IP. Please try again after one Hour",
});
app.use("/", limiter);

app.use(cors());
//body parser: reading data from body req.body or use body-parser both same .we can limit body data
app.use(express.json({ limit: "10kb" }));
//  clean our code from malicious if req.body contain malicious data
// Data Sanitization for NoSQL query injection
app.use(mongoSanitize());
// Data Sanitization for XSS
app.use(xssClean());

app.use(hpp());
dotenv.config({ path: "./config.env" });
app.use("/", RouterData);
// test middle ware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// -----------------------------------db----------------------------------------
const DB = "mongodb://127.0.0.1:27017/newdata";
mongoose.connect(DB, {
  useNewUrlParser: true,
});

const db = mongoose.connection;
db.once("open", () => {
  useUnifiedTopology: true, console.log("database is connected");
});
// -------------------------------port listen-------------------------------------------
app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
