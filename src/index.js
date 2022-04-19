const express = require('express');
const bodyParser = require('body-parser');
const multer =  require("multer")
const { default: mongoose } = require('mongoose');
const app = express();
const route = require('./routes/route.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());

mongoose.connect("mongodb+srv://CCAnkit:CCAnkit09@clusternew.gds9x.mongodb.net/group35Database", {    //Connecting to the Database 
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);    //parse incoming request body in JSON format

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))    //Listen for incoming requests
});





