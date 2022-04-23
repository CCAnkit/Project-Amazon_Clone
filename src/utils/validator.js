const mongoose = require("mongoose")

//Creating a validation function
const isValidValue = function (value) {     //if the value is undefined or null || string & number & object that length is 0 it will return false.
    if (typeof (value) === undefined || typeof (value) === null) { return false }    //it checks whether the value is null or undefined.
    if (typeof (value) === "string" && (value).trim().length > 0) { return true }      //it checks whether the string contain only space or not
};

const isValidNumber = function (value){
    if (typeof (value) === "number" && (value).toString().trim().length > 0) { return true }    //it checks whether the number contain only space or not
};

const isValidDetails = function(requestBody) {
    return Object.keys(requestBody).length > 0;       // it checks, is there any key is available or not in request body
};

const isValidObjectId = function (objectId){    
    return mongoose.Types.ObjectId.isValid(objectId)    //Creating a validation function for Object Id
};

let validateEmail = function (email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);    //Checking if user entered a valid email or not
};

let validatephone = function (phone) {
    return /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[6789]\d{9}|(\d[ -]?){10}\d$/.test(phone)   //Checking if user entered a valid phone or not
};

let validatePassword = function (password) {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/.test(password)    //Checking if user entered a valid phone or not
};

let validateChar = function(value){
    return /^[A-Za-z\s]+$/.test(value)
};

// let validateStringNoSpace = function (value) {
//     return /^\S*$/.test(value)
// };

let isValidPincode = function (value) {
    if (!isNaN(value) && value.toString().length == 6) return true
};

// let validatePrice = function (price) {
//     return /^\d+(?:\.\d{1,2})?$/.test(price)    
// };

const isValidSize = function (input) {
    return ["S", "XS","M","X", "L","XXL", "XL"].indexOf(input) !== -1;  //enum validation
};

const validInstallment = function isInteger(value) {
    if (value < 0) return false
    if (value % 1 == 0) return true;
};

const isValidStatus = function(status) {
    return ['pending', 'completed', 'cancelled'].indexOf(status) !== -1
};


module.exports = { isValidValue, isValidDetails, isValidNumber, isValidObjectId, validateEmail, validatephone, validatePassword, 
        validateChar, /*validateStringNoSpace,*/ isValidPincode, /*validatePrice,*/ isValidSize, validInstallment,  isValidStatus};
