const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.js");
const productController = require("../controllers/productController.js");
const cartController = require("../controllers/cartController.js");
const orderController = require("../controllers/orderController.js");
const middleware = require("../utils/auth.js");

//User API's
router.post("/register", userController.createUser);  //CreateUser
router.post("/login", userController.login);  //LoginUser
router.get("/user/:userId/profile", middleware.userAuth, userController.getProfile);   //getProfile
router.put("/user/:userId/profile", middleware.userAuth,  userController.updateProfile);  //updateProfile

//Product API's
router.post("/products", productController.createProduct);   // createProduct
router.get("/products", productController.getAllProducts);   //getAllProducts
router.get("/products/:productId", productController.getProductById);   //getProductById
router.put("/products/:productId",  productController.updateProduct);    //updateProduct
router.delete("/products/:productId", productController.deleteProduct);   //deleteProduct

//Cart API's
router.post("/users/:userId/cart", middleware.userAuth, cartController.addToCart);  // addToCart
router.put("/users/:userId/cart", middleware.userAuth, cartController.updateCart);   //updateCart
router.get("/users/:userId/cart", middleware.userAuth, cartController.getCartDetails);  //getCartDetails
router.delete("/users/:userId/cart", middleware.userAuth, cartController.deleteCart);  //deleteCart

//Order API's
router.post("/users/:userId/orders", middleware.userAuth, orderController.createOrder);  //createOrder
router.put("/users/:userId/orders", middleware.userAuth, orderController.updateOrder);  //updateOrder


module.exports = router;