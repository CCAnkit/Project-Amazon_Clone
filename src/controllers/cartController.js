const cartModel = require("../models/cartModel.js");
const userModel = require("../models/userModel.js");
const productModel = require("../models/productModel.js");
const validator = require('../utils/validator.js');


// -----------addToCart-----------------------------------------------------------------------------------
const addToCart = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, msg: "Invalid params present in URL"})
        }

        let data = req.body
        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, msg: "Please provide valid details" })   //validating the parameters of body
        }

        const userIdFromParams = req.params.userId;
        const userIdFromToken = req.userId;

        if (!validator.isValidObjectId(userIdFromParams)) {
          return res.status(400).send({ status: false, message: 'Please enter valid details' });
        }

        const findUser = await userModel.findById(userIdFromParams);
        if (!findUser) {
            return res.status(404).send({ status: false, message: 'User not found.' });
        }
        // if (userIdFromToken !== userIdFromParams) {
        //   return res.status(400).send({ status: false, message: 'Unauthorized Access' });
        // }
        
        const { quantity, productId } = data

        if (!validator.isValidObjectId(productId) || !validator.isValidValue(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" })
        }
        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
            return res.status(404).send({ status: false, message: 'Product not found.' });
        }
        if(findProduct.isDeleted == true){
            return res.status(400).send({ status:false, msg: "Product is deleted" });
        }

        if (!validator.isValidValue(quantity) || !validator.validQuantity(quantity)) {
            return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." })
        }
        
        if (findUser._id.toString() != userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });     //Authentication & authorization
            return
        }

        const findCartOfUser = await cartModel.findOne({ userId: userIdFromParams }) //finding cart related to user.

        if (!findCartOfUser) {      //destructuring for the response body.
            var cartData = {
                userId: userIdFromParams,
                items: [{ productId: productId, quantity: quantity }],
                totalPrice: (findProduct.price) * quantity,
                totalItems: 1
            }
            const createCart = await cartModel.create(cartData)
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart })
        }

        if (findCartOfUser) {
            //updating price when products get added or removed.
            let price = findCartOfUser.totalPrice + (req.body.quantity * findProduct.price)
            let itemsArr = findCartOfUser.items

            //updating quantity.
            for(let i=0; i<itemsArr.length; i++){
                if (itemsArr[i].productId.toString() === productId) {
                    itemsArr[i].quantity += quantity
                    let updatedCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }
                    let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true })
                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })
                }
            }

            itemsArr.push({ productId: productId, quantity: quantity })   //storing the updated prices and quantity to the newly created array.

            let updatedCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }
            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true, upsert:true })
            return res.status(200).send({ status: true, message: `Product added to the cart successfully`, data: responseData })
        }
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}

// -----------updateCart-----------------------------------------------------------------------------------
const updateCart = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, msg: "Invalid params present in URL"})
        }

        let data = req.body
        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, msg: "Please enter your details to Register" })   //validating the parameters of body
        }

        const userIdFromParams = req.params.userId        
        const userIdFromToken = req.userId

        const {productId, cartId, removeProduct} = data

        if (!validator.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, msg: "UserId is invalid" });
        }
        const userByuserId = await userModel.findById(userIdFromParams);
        if (!userByuserId) {
            return res.status(404).send({ status: false, message: 'User not found.' });
        }
        if (userIdFromToken != userIdFromParams) {
            return res.status(403).send({ status: false, message: "Unauthorized access." });
        }
        if (!validator.isValidValue(productId)) {
            return res.status(400).send({ status: false, messege: "Please provide productId" })
        }
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "ProductId is invalid" });
        }
        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
            return res.status(404).send({ status: false, message: 'Product not found.' });
        }
        if(findProduct.isDeleted == true){
            return res.status(400).send({ status:false, msg: "Product is deleted" });
        }

        if (!validator.isValidValue(cartId)) {
            return res.status(400).send({ status: false, messege: "Please provide cartId" })
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "CartId is invalid" });
        }
        const findCart = await cartModel.findById(cartId);
        if (!findCart) {
            return res.status(404).send({ status: false, message: 'Cart is not exist.' });
        }

        const findProductInCart = await cartModel.findOne({ items: { $elemMatch: { productId: productId } } });
        if (!findProductInCart) {
            return res.status(404).send({ status: false, message: 'No Product found in the cart.' });
        }
        if (!validator.isValidValue(removeProduct)) {
            return res.status(400).send({ status: false, messege: "Please provide items to remove." })
        }
        if ((isNaN(Number(removeProduct)))) {           
            return res.status(400).send({ status: false, message:'RemoveProduct should be a valid number' })   //removeProduct validation either 0 or 1.
        }
        if ((removeProduct != 0) && (removeProduct != 1)) {    //removeProduct => 0 for product remove completely, 1 for decreasing its quantity.
            return res.status(400).send({ status: false, message: 'RemoveProduct should be 0 or 1' })    
        }
        // console.log(removeProduct)
        let findQuantity = findCart.items.find(x => x.productId.toString() === productId)
        
        if (removeProduct == 0) {
            let totalAmount = findCart.totalPrice - (findProduct.price * findQuantity.quantity)   //Substract the amount of product*quantity
            let quantity = findCart.totalItems - 1

            let newCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true })     //update the cart with total items and totalprice
                return res.status(200).send({ status: true, msg: 'Product has been removed from the cart', data: newCart })
        }

        if(removeProduct == 1){
            // console.log("coming in")
        let totalAmount = findCart.totalPrice - findProduct.price
        let itemsArr = findCart.items
            for(let i=0; i<itemsArr.length; i++){
                if(itemsArr[i].productId.toString() === productId){
                    itemsArr[i].quantity = itemsArr[i].quantity - 1
                    if (itemsArr[i].quantity == 0) {
                        // console.log("quantity has become 0 now.")
                        var noOfItems = findCart.totalItems - 1
                        let newCart = await cartModel.findOneAndUpdate({ _id: cartId },{ $pull: { items: { productId: productId } },$set: { totalPrice: totalAmount, totalItems: noOfItems } }, { new: true })
                            return res.status(200).send({ status:true, msg: 'Product has been removed from the cart', data: newCart })
                       }
                }
            }
        //    console.log("quantity is not 0.")
        let data = await cartModel.findOneAndUpdate({ _id: cartId }, {totalPrice: totalAmount, items: itemsArr}, { new: true })
            return res.status(200).send({ status:true, msg: 'Product in the cart updated successfully.', data: data })
        }
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}

// -----------getCartDetails-----------------------------------------------------------------------------------
const getCartDetails = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, msg: "Invalid params present in URL"})
        }
        let userIdFromParams = req.params.userId
        let userIdFromToken = req.userId

        if (!validator.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, msg: "userId is invalid" });
        }

        const userByuserId = await userModel.findById(userIdFromParams);
        if (!userByuserId) {
            return res.status(404).send({ status: false, message: 'user not found.' });
        }
        if (userIdFromToken != userIdFromParams) {
            return res.status(403).send({ status: false, message: "Unauthorized access." });
        }
        const findCart = await cartModel.findOne({ userId: userIdFromParams })
        if (!findCart) {
            return res.status(400).send({ status: false, message: "No cart exist with this id" })
        }
        if(findCart.totalPrice === 0){
            return res.status(404).send({status:false, msg:"Your cart is empty."})
        }
       return res.status(200).send({status:true, msg:"Cart Details.", data: findCart})
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}

// -----------deleteCart-----------------------------------------------------------------------------------
const deleteCart = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, msg: "Invalid params present in URL"})
        }

        let userIdFromParams = req.params.userId
        let userIdFromToken = req.userId

        if (!validator.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, msg: "UserId is invalid" });
        }
        const userByuserId = await userModel.findById(userIdFromParams);
        if (!userByuserId) {
            return res.status(404).send({ status: false, message: 'User not found.' });
        }
        if (userIdFromToken != userIdFromParams) {
            return res.status(403).send({ status: false, message: "Unauthorized access." });
        }
        const findCart = await cartModel.findOne({ userId: userIdFromParams })
        if (!findCart) {
            return res.status(400).send({ status: false, message: "No cart exist with this id" })
        }
        if(findCart.totalPrice === 0){
            return res.status(404).send({status:false, msg:"Your cart is Empty."})
        }
        let deleteCart =  await cartModel.findOneAndUpdate({ userId: userIdFromParams }, {$set: { items: [], totalPrice: 0, totalItems: 0}})
        
        const findCartAfterDeletion = await cartModel.findOne({ userId: userIdFromParams })
        
        return res.status(200).send({status: true, message: "All products have been removed from the cart successfully", data: findCartAfterDeletion})
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}


module.exports = { addToCart, updateCart, getCartDetails, deleteCart }; 