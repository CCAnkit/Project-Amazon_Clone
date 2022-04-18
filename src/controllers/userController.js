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
            return res.status(400).send({status:false, msg:"Please provide the Street in Shipping Address"})   //Shipping.street is mandory 
        }
        if (!validator.isValidValue(address.shipping.city)){
            return res.status(400).send({status:false, msg:"Please provide the City in Shipping Address"})   //Shipping.city is mandory 
        }
        if (!validator.isValidValue(address.shipping.pincode)){
            return res.status(400).send({status:false, msg:"Please provide the pincode in Shipping Address"})   //Shipping.pincode is mandory 
        }
        if (!validator.isValidValue(address.billing.street)){
            return res.status(400).send({status:false, msg:"Please provide the Street in Billing Address"})   //billing.street is mandory 
        }
        if (!validator.isValidValue(address.billing.city)){
            return res.status(400).send({status:false, msg:"Please provide the City in Billing Address"})   //billing.city is mandory 
        }
        if (!validator.isValidValue(address.billing.pincode)){
            return res.status(400).send({status:false, msg:"Please provide the pincode in Billing Address"})   //billing.pincode is mandory 
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
	        return res.status(401).send({status: false, message:"Password is invalid, Please check your credentials again"});
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
        if (!validator.isValidObjectId(UserId)){
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
            return res.status(400).send({ status: false, msg: "Please provide details to Update" })   //validating the parameters of body
        }

        //Updates a User by changing these values 
        const { fname, lname, email, phone, password } = data

        // const fnameUsed = await userModel.findOne({fname})    //
        // if(fnameUsed){
        //     return res.status(400).send({status:false, msg:`${fname} is already exists`})   //checking the fname is already exist or not.
        // }
        // const lnameUsed = await userModel.findOne({lname})    //
        // if(lnameUsed){
        //     return res.status(400).send({status:false, msg:`${lanme} is already exists`})   //checking the lname is already exist or not.
        // }
        if(email){
            if (!validator.validateEmail(email)){
                return res.status(400).send({status: false , message: "Please enter a valid email"})
            }
            let uniqueEmail = await userModel.findOne({email})
            if (uniqueEmail) {
                return res.status(400).send({status: false , message: "Email already exists"})     //Checking if email is unique or not
            }
        }
        if(phone) {
            if (!validator.validatephone(phone)){
                return res.status(400).send({status: false , message: "Please enter a valid phone"})
            }
            let uniquephone = await userModel.findOne({phone})
            if (uniquephone) {
                return res.status(400).send({status: false , message: "phone already exists"})        //Checking if phone is unique or not
            }
        }
        if(password) {
            if(!validator.validatePassword(password)){
                return res.status(400).send({status:false,msg:"Please provide the valid Password"})    //Regex for checking the valid password format contains 8-15 characters or not
            }
            const salt = bcrypt.genSaltSync(10);
            const encryptedPassword = bcrypt.hashSync(password, salt);           // Hashing the passwords
        }
        
        let stringifyShippingAddress = JSON.stringify(dataToUpdate.address)
        
        let parseShippingAddress = JSON.parse(stringifyShippingAddress)
        
        // const address = JSON.parse(data.address)    //converting the address into JSON form
        
        if (!validator.isValidValue(address.shipping.street)){
            return res.status(400).send({status:false, msg:"Please provide the Street in Shipping Address"})   //Shipping.street is mandory 
        }
        if (!validator.isValidValue(address.shipping.city)){
            return res.status(400).send({status:false, msg:"Please provide the City in Shipping Address"})   //Shipping.city is mandory 
        }
        if (!validator.isValidValue(address.shipping.pincode)){
            return res.status(400).send({status:false, msg:"Please provide the pincode in Shipping Address"})   //Shipping.pincode is mandory 
        }
        if (!validator.isValidValue(address.billing.street)){
            return res.status(400).send({status:false, msg:"Please provide the Street in Billing Address"})   //billing.street is mandory 
        }
        if (!validator.isValidValue(address.billing.city)){
            return res.status(400).send({status:false, msg:"Please provide the City in Billing Address"})   //billing.city is mandory 
        }
        if (!validator.isValidValue(address.billing.pincode)){
            return res.status(400).send({status:false, msg:"Please provide the pincode in Billing Address"})   //billing.pincode is mandory 
        }

        if (requestBody.address) {
            // requestBody.address = JSON.parse(requestBody.address)            if (requestBody.address.shipping) {
            if (User.address.shipping.street) {
              UserFound.address.shipping.street = requestBody.address.shipping.street;
              await UserFound.save();
            }
            if (requestBody.address.shipping.city) {
              UserFound.address.shipping.city = requestBody.address.shipping.city;
              await UserFound.save();
            }
            if (requestBody.address.shipping.pincode) {
              UserFound.address.shipping.pincode =
                requestBody.address.shipping.pincode;
              await UserFound.save();
            }
            if (requestBody.address.billing) {
              if (requestBody.address.billing.street) {
                UserFound.address.billing.street = requestBody.address.billing.street;
                await UserFound.save();
              }
              if (requestBody.address.billing.city) {
                UserFound.address.billing.city = requestBody.address.billing.city;
                await UserFound.save();
              }
              if (requestBody.address.billing.pincode) {
                UserFound.address.billing.pincode =
                  requestBody.address.billing.pincode;
                await UserFound.save();
              }
            }
          }
          // requestBody.UpdatedAt = new Date()
      


        let files = req.files       //aws
        if (files && files.length > 0) {      
            var profileImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
        }

        
        

        //Updating a User document
        let updatedUser = await userModel.findOneAndUpdate({ _id: UserId },
            {
                $set: {
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
            }, { new: true, upsert : true })

        //Sending the updated response
        return res.status(200).send({ status: true, message: "Your User details have been successfully updated", data: updatedUser })
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}



module.exports = { createUser, login, getProfile, updateProfile }; 



// if (validator.isValidDetails(parseShippingAddress)) {
//     if (parseShippingAddress.hasOwnProperty('shipping')) {
//         if (parseShippingAddress.shipping.hasOwnProperty('street')) {
//             if (!validator.isValidValue(parseShippingAddress.shipping.street)) {
//                 return res.status(400).send({ status: false, message: "Please provide shipping address's Street" });
//             }
//         }
//         if (parseShippingAddress.shipping.hasOwnProperty('city')) {
//             if (!validator.isValidValue(parseShippingAddress.shipping.city)) {
//                 return res.status(400).send({ status: false, message: "Please provide shipping address's City" });
//             }
//         }
//         if (parseShippingAddress.shipping.hasOwnProperty('pincode')) {
//             if (!validator.isValidValue(parseShippingAddress.shipping.pincode)) {
//                 return res.status(400).send({ status: false, message: "Please provide shipping address's pincode" });
//             }
//         }
//     }

// var shippingStreet = address.shipping.street
// var shippingCity = address.shipping.city
// var shippingPincode = address.shipping.pincode
// } else {
//     return res.status(400).send({ status: false, message: "Shipping address cannot be empty" });
// }
// }

// if (dataToUpdate.address) {

// let stringifyBillingAddress = JSON.stringify(dataToUpdate.address)
// let parseBillingAddress = JSON.parse(stringifyBillingAddress)

// if (validator.isValidDetails(parseBillingAddress)) {
//     if (parseBillingAddress.hasOwnProperty('billing')) {
//         if (parseBillingAddress.billing.hasOwnProperty('street')) {
//             if (!validator.isValidValue(parseBillingAddress.billing.street)) {
//                 return res.status(400).send({ status: false, message: "Please provide billing address's Street" });
//             }
//         }
//         if (parseBillingAddress.billing.hasOwnProperty('city')) {
//             if (!validator.isValidValue(parseBillingAddress.billing.city)) {
//                 return res.status(400).send({ status: false, message: "Please provide billing address's City" });
//             }
//         }
//         if (parseBillingAddress.billing.hasOwnProperty('pincode')) {
//             if (!validator.isValidValue(parseBillingAddress.billing.pincode)) {
//                 return res.status(400).send({ status: false, message: "Please provide billing address's pincode" });
//             }
//         }

//     }
// var billingStreet = address.billing.street
// var billingCity = address.billing.city
// var billingPincode = address.billing.pincode
// } else {
//     return res.status(400).send({ status: false, message: "Billing address cannot be empty" });
// }
// }
