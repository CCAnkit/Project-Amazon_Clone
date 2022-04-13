//Importing express , body-Parser , mongoose and multer package
const express = require('express');
const bodyParser = require('body-parser');
const multer =  require("multer")
const { default: mongoose } = require('mongoose');
const app = express();

//Importing route file
const route = require('./routes/route.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());

//Connecting to Database //
mongoose.connect("mongodb+srv://CCAnkit:CCAnkit09@clusternew.gds9x.mongodb.net/group35Database", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

//parse incoming request body in JSON format
app.use('/', route);

//Listen for incoming requests
app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});





