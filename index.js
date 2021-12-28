const express = require('express')
const app = express()
const path = require('path');
const port = process.env.PORT || 3000

/* 
    Incase you are using mongodb atlas database uncomment below line
    and replace "mongoAtlasUri" with your mongodb atlas uri.
*/
// mongoose.connect( mongoAtlasUri, {useNewUrlParser: true, useUnifiedTopology: true})

app.use(express.static(__dirname+'/public'));

//lost
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/pages/lost.html'));
})

//won
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname+'/pages/won.html'));
// })

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})
