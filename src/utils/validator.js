const mongoose = require("mongoose")

//Creating a validation function
const isValidValue = function (value) {     //if the value is undefined or null || string & number & object that length is 0 it will return false.
    if (typeof (value) === undefined || typeof (value) === null) { return false }    //it checks whether the value is null or undefined.
    if (typeof (value) === "string" && (value).trim().length > 0) { return true }      //it checks whether the string contain only space or not
    if (typeof (value) === "number" && (value).toString().trim().length > 0) { return true }    //it checks whether the number contain only space or not
    if (typeof (value) === "object" && value.length > 0) { return true }    //it checks whether the Object contain only space or not.
}

const isValidDetails = function(requestBody) {
    return Object.keys(requestBody).length > 0;       // it checks, is there any key is available or not in request body
};

// const isValidQuery = function(requestQuery) {
//     return Object.keys(requestQuery).length > 0;       // it checks, is there any key is available or not in query
// };

const isValidObjectId = function (objectId){    
    return mongoose.Types.ObjectId.isValid(objectId)    //Creating a validation function for Object Id
}

let validateEmail = function (email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);    //Checking if user entered a valid email or not
}

let validatephone = function (phone) {
    return /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[6789]\d{9}|(\d[ -]?){10}\d$/.test(phone)   //Checking if user entered a valid phone or not
}

let validatePassword = function (password) {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/.test(password)    //Checking if user entered a valid phone or not
}



module.exports.isValidValue = isValidValue;
module.exports.isValidDetails = isValidDetails;
// module.exports.isValidQuery = isValidQuery;
module.exports.isValidObjectId = isValidObjectId;
module.exports.validateEmail = validateEmail;
module.exports.validatephone = validatephone;
module.exports.validatePassword = validatePassword;