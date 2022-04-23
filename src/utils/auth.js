const jwt = require("jsonwebtoken")

//Creating Authorization feature 
const userAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization', 'Bearer Token')

    if (!token) {     //validating the token is present in headers or not.
      return res.status(403).send({ status: false, message: 'Token must be present' });
    }

    let validToken = token.split(' ')

    if(validToken.length !== 2 || validToken[0] !== "Bearer" || !validToken[1] ){
      return res.status(403).send({ status: false, message: 'Invalid token format.' })
    }

    const decodeToken = jwt.verify(validToken[1], "Project-ShoppingCart", {ignoreExpiration: true})    //If present then verify the secret key
    if (!decodeToken) {
      return res.status(403).send({ status: false, message: 'You are not autherised to access.' });
    }

    let expiration = decodeToken.exp
      
    let tokenExtend = Math.floor(Date.now() / 1000) 

    if (expiration < tokenExtend){
      return res.status(401).send({ status: false, message: "Token is expired" })
    }

    req.userId = decodeToken.userId     
        
      next();     //if token is present & for the same user then move to the next
    } 
    catch (err) {
        console.log(err);
        res.status(500).send({ message: err.message });
    }
};

module.exports.userAuth = userAuth;







//Creating Authentication feature 
// const authentication = async function (req, res, next) {
//     try {
//         //Checking if "x-api-key" is present in request header or not
//         let token = req.headers["authorization"] 
//         if (!token) {
//             return res.status(400).send({ status: false, message: "You need to login to perform this task" })
//         }
//         if (token.startsWith('Bearer ')) {
//             token = token.slice(7 , token.length)
//         }

//         //Checking if token is valid or not
//         let decodedtoken = jwt.verify(token, "Secret-Key-given-by-us-to-secure-our-token")
//         if (!decodedtoken){
//             return res.status(401).send({ status: false, message: "Token is invalid" })
//         }
        
//         //Checking if token expired or not
//         let expiration = decodedtoken.exp
//         let tokenExtend = Math.floor(Date.now() / 1000) 
//         console.log(tokenExtend - expiration)
//         if (expiration < tokenExtend){
//             return res.status(401).send({ status: false, message: "Token expired" })
//         }

//         next();
//     }
//     //Exceptional error handling
//     catch (error) {
//         console.log(error)
//         return res.status(500).send({ message: error.message })
//     }
// }
// ======================================================================================================//

//Creating authorisation feature - so a user can create, update & delete his Users only
// const authorisation = async function (req, res, next) {
//     try {
//         let token = req.headers["Authorization", "Bearer Token"];
//         if (token.startsWith('Bearer ')) {
//             token = token.slice(7 , token.length)
//         }
//         let decodedtoken = jwt.verify(token, "Project-ShoppingCart")
    
//         //Checking if User Id is present in params or not
//         let newUserId = req.params.userId
//         //If present
//         if (newUserId) {
//             let profileUserId = await UserModel.findOne({ _id: newUserId })
//             let UserId = profileUserId.id
//             let id = decodedtoken.userId
//             if (id != UserId){
//                 return res.status(403).send({ status: false, message: "You are not authorised to perform this task" })
//             }
//         }

//         next()
//     }
//     //Exceptional error handling
//     catch (error) {
//         console.log(error)
//         return res.status(500).send({ message: error.message })
//     }
// }

// //Exporting the above authentication & authorisation functions
// module.exports = { authentication , authorisation }






