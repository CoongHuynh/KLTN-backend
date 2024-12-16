const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { readdirSync } = require("fs");
const helmet = require("helmet"); // Add this line
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://*.paypal.com",
        "https://*.paypalobjects.com",
      ],
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://*.paypal.com",
        "https://*.paypalobjects.com",
        "'unsafe-inline'",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https://*.paypal.com",
        "https://*.paypalobjects.com",
      ],
      connectSrc: [
        "'self'",
        "https://*.paypal.com",
        "https://*.paypalobjects.com",
      ],
      frameSrc: ["'self'", "https://*.paypal.com"],
    },
  })
);
//routes
readdirSync("./routes").map((r) => app.use("/", require("./routes/" + r)));

//database
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log(`Connected to database: ${mongoose.connection.name}`);
  })
  .catch((err) => console.log("error connecting to mongodb", err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}...!`);
});
