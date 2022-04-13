const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.js");
// const productController = require("../controllers/productController.js");
// const cartController = require("../controllers/cartController.js");
// const orderController = require("../controllers/orderController.js");
// const middleware = require("../utils/auth.js");

//User API's
router.post("/register", userController.createUser);   //CreateUser
router.post("/login", userController.login);   //LoginUser
router.get("/user/:userId/profile", /*middleware.authentication, middleware.authorisation,*/ userController.getProfile);      //getProfile
router.put("/user/:userId/profile", /*middleware.authentication, middleware.authorisation,*/ userController.updateProfile);    //updateProfile

//Product API's
// router.post("/products", productController.createProduct);    // createProduct
// router.get("/products/:productId", productController.getProducts);     //getProducts
// router.put("/products/:productId",  productController.updateProduct);    //updateProduct
// router.delete("/products/:productId", productController.deleteProduct);   //deleteProduct

// //Cart API's
// router.post("/users/:userId/cart", cartController.addToCart);    // addToCart
// router.put("/users/:userId/cart",  cartController.updateCart);    //updateCart
// router.get("/users/:userId/cart", cartController.getCartDetails);     //getCartDetails
// router.delete("/users/:userId/cart", cartController.deleteCart);   //deleteCart

// //Order API's
// router.post("/users/:userId/orders", orderController.createOrder);   //createOrder
// router.put("/users/:userId/orders", orderController.updateOrder);   //updateOrder


module.exports = router;