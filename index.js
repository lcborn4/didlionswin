const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;

const condition = require("./controllers/condition.controller");

app.use(express.static(__dirname + "/public"));

//lost
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname+'/pages/lost.html'));
// })

//won
app.get("/", async (req, res) => {
  let score = await condition.checkScore();
  console.log("score", score);
  res.sendFile(path.join(__dirname + "/pages/won.html"));
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
