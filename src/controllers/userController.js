const userModel = require("../models/userModel.js");
const validator = require('../utils/validator.js');
const awsConfig = require('../utils/awsConfig')
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");


// -----------CreateUser-----------------------------------------------------------------------------------
const createUser = async (req, res) => {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, msg: "Invalid params present in URL"})
        }

        let data = req.body
        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, msg: "Please enter your details to Register" })   //validating the parameters of body
        }
        const { fname, lname, email, phone, password } = data

        if (!validator.isValidValue(fname)){
            return res.status(400).send({status:false, msg:"Please provide the First name"})   //fname is mandory 
        }
        if (!validator.isValidValue(lname)){
            return res.status(400).send({status:false, msg:"Please provide the Last name"})   //lname is mandory 
        }
        if (!validator.isValidValue(email)){
            return res.status(400).send({status:false, msg:"Please provide Email Address"})   //email is mandory
        }
        if(!validator.validateEmail(email)){
            return res.status(400).send({status:false, msg:"Please provide the valid Email Address"})    //Regex for checking the valid email format 
        }
        const emailUsed = await userModel.findOne({email})    //unique is email
        if(emailUsed){
            return res.status(400).send({status:false, msg:`${email} is already exists`})   //checking the email address is already exist or not.
        }
        
        if (!validator.isValidValue(phone)){
            return res.status(400).send({status:false, msg:"Please provide phone number"})    //phone is mandory
        }
        if(!validator.validatephone(phone)){
            return res.status(400).send({status:false,msg:"Please provide valid phone number"})    //Regex for checking the valid phone format
        }
        const phoneUsed = await userModel.findOne({phone})   //phone is unique
        if(phoneUsed){
            return res.status(400).send({status:false, msg:`${phone} is already exists`})   //checking the phone number is already exist or not.
        }    
        if (!validator.isValidValue(password)){
            return res.status(400).send({status:false, msg:"Please provide the Password"})   //password is mandory 
        }
        if(!validator.validatePassword(password)){
            return res.status(400).send({status:false,msg:"Please provide the valid Password"})    //Regex for checking the valid password format 
        }
        // Hashing the passwords
        const salt = bcrypt.genSaltSync(10);
        const encryptedPassword = bcrypt.hashSync(password, salt);

        const address = JSON.parse(data.address)    //converting the address into JSON form

        if (!validator.isValidValue(address.shipping.street)){
            return res.status(400).send({status:false, msg:"Please provide the Shipping Address"})   //Shipping.street is mandory 
        }
        if (!validator.isValidValue(address.shipping.city)){
            return res.status(400).send({status:false, msg:"Please provide the Shipping Address"})   //Shipping.city is mandory 
        }
        if (!validator.isValidValue(address.shipping.pincode)){
            return res.status(400).send({status:false, msg:"Please provide the Shipping Address"})   //Shipping.pincode is mandory 
        }
        if (!validator.isValidValue(address.billing.street)){
            return res.status(400).send({status:false, msg:"Please provide the Billing Address"})   //billing.street is mandory 
        }
        if (!validator.isValidValue(address.billing.city)){
            return res.status(400).send({status:false, msg:"Please provide the Billing Address"})   //billing.city is mandory 
        }
        if (!validator.isValidValue(address.billing.pincode)){
            return res.status(400).send({status:false, msg:"Please provide the Billing Address"})   //billing.pincode is mandory 
        }
        let files = req.files
        if (files && files.length > 0) {      
            var profileImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
        }
        else {
            return res.status(400).send({ status: false, message: "Please upload your Profile Image" })   //profileImage is mandory
        }
        
        const user = {
            fname,
            lname,
            email,
            profileImage,
            phone,
            password: encryptedPassword,
            address: {
                shipping: {
                    street: address.shipping.street,
                    city: address.shipping.city,
                    pincode: address.shipping.pincode
                },
                billing: {
                    street: address.billing.street,
                    city: address.billing.city,
                    pincode: address.billing.pincode
                }
            }
       }

       let UserData = await userModel.create(user)      //If all these validations passed , creating a user
       return res.status(201).send({status: true , message: "You're registered successfully", data: UserData })
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}


// -------------UserLogin-----------forAuthentication----------------------------------------------------------------------------
const login = async (req, res) => {
    try{
        const query = req.query
        if (Object.keys(query) != 0) {
            return res.status(400).send({status: false , message: "Invalid params present in URL"})     //validating the parameters of body
        }

        const login = req.body
        if (!validator.isValidDetails(login)){
            return res.status(400).send({ status: false, msg: "Please provide the Login Details" })   //validating the parameters of body
        }
        
        const {email, password} = login
        
        if (!validator.isValidValue(email)){
            return res.status(400).send({status:false, msg:"Please provide the Email Address"})   //email is mandatory
        }
        if (!validator.isValidValue(password)){
            return res.status(400).send({status:false, msg:"Please provide the password"})  //password is mandatory
        }
        // Matching that email  with a user document in our UserModel
        const userDetails = await userModel.findOne({ email: email })     //validating the email/password in the userModel.

        //If no such user found 
        if (!userDetails) {
            return res.status(401).send({ status: false, message: "Email is not correct, Please check your credentials again" })
        }
        // make a comparison between entered password and the database password
        const validatePassword = await bcrypt.compare(login.password, userDetails.password);    //converting normal password to hashed value to match it with DB's entry by using compare function.
        if (!validatePassword) {
	        return res.status(401).send("Password is invalid, Please check your credentials again");
        }

        const token = jwt.sign(   //creating the token for the authentication.
            {
                userId : userDetails._id,   //payload(details that we saved in this token)
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (10*60*60)
            },
                "Project-ShoppingCart");  //secret key with the expiry
            // res.setHeader("x-api-key", token);  //setting token in header
        res.status(200).send({ status: true, message: `User logged in successfully`, data: { userId: token.userId, token} }); 
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}


// -----------getProfile-----------------------------------------------------------------------------------
const getProfile = async (req, res) => {
    try{
        const query = req.query
        if (Object.keys(query) != 0) {
            return res.status(400).send({status: false , message: "Invalid params present in URL"})     //validating the parameters of body
        }
        let UserId = req.params.userId
        if (!validator.isValidObjectId(UserId)){
            return res.status(400).send({status: false , message: `${UserId} is not valid type user Id`})      //Checking if user Id is a valid type Object Id or not
        }

        
        let user = await userModel.findOne({_id: UserId, isDeleted: false})       //Validate: The userId is valid or not.
        if (!user) {
            return res.status(404).send({ status: false, message: "user does not exists" })     
        }

       //Validate: If the userId exists (must have isDeleted false)
    //    let is_Deleted = user.isDeleted
    //    if (is_Deleted == true) {
    //        return res.status(404).send({ status: false, message: "User does not exists" })
    //    }

       //Sending the response in the required format
       return res.status(200).send({status: true, message: "User data" , data: user})
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}


// -----------updateProfile-----------------------------------------------------------------------------------
const updateProfile = async (req, res) => {
    try{
        const query = req.query
        if (Object.keys(query) != 0) {
            return res.status(400).send({status: false , message: "Invalid params present in URL"})
        }

        let UserId = req.params.userId
        //Checking if User Id is a valid type Object Id or not
        if (!isValidObjectId(UserId)){
            return res.status(400).send({status: false , message: `${UserId} is not valid type user Id`})
        }
        //Validate: The UserId is valid or not.
        let User = await userModel.findOne({_id: UserId, isDeleted: false})
        if (!User) {
            return res.status(404).send({ status: false, message: "User does not exists" })
        }
        // //Validate: If the UserId exists (must have isDeleted false)
        // let is_Deleted = User.isDeleted
        // if (is_Deleted == true) return res.status(404).send({ status: false, message: "User does not exists" })
        
        //Checking if no data is present in request body
        let data = req.body
        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, msg: "Please provide details to update in a User document" })   //validating the parameters of body
        }

        //Updates a User by changing these values 
        const { fname, lname, email, phone, password, address } = req.body
        
        if (!validator.validateEmail(email)){
            return res.status(400).send({status: false , message: "Please enter a valid email"})
        }
        //Checking if email is unique or not
        let uniqueEmail = await userModel.findOne({email : email})
        if (uniqueEmail) {
            return res.status(400).send({status: false , message: "Email already exists"})
        }

        if (!validator.validatephone(phone)){
            return res.status(400).send({status: false , message: "Please enter a valid phone"})
            }
    
        //Checking if phone is unique or not
        let uniquephone = await userModel.findOne({phone : phone})
        if (uniquephone) {
             return res.status(400).send({status: false , message: "phone already exists"})
        }

        //Checking if password contains 8-15 characters or not
        if(!validator.validatePassword(password)){
            return res.status(400).send({status:false,msg:"Please provide the valid Password"})    //Regex for checking the valid password format 
        }

         // Hashing the passwords
        const salt = bcrypt.genSaltSync(10);
        const encryptedPassword = bcrypt.hashSync(password, salt);


        let files = req.files       //aws
        if (files && files.length > 0) {      
            var profileImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
        }
        

        //Updating a User document
        let updatedUser = await userModel.findOneAndUpdate({ _id: User_Id },
            {
                $set: {
                    fname,
                    lname,
                    email,
                    profileImage,
                    phone,
                    password: encryptedPassword
                }
            }, { new: true, upsert : true })

        //Sending the updated response
        return res.status(200).send({ status: true, message: "Your User details have been successfully updated", data: updatedUser })
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}



module.exports.createUser = createUser; 
module.exports.login = login;
module.exports.getProfile = getProfile;
module.exports.updateProfile = updateProfile;
