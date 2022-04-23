const orderModel = require("../models/orderModel.js");
const cartModel = require("../models/cartModel.js");
const userModel = require("../models/userModel.js");
const validator = require('../utils/validator.js');


// -----------createOrder-----------------------------------------------------------------------------------
const createOrder = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }
        
        const userIdFromParams = req.params.userId

        const userIdFromToken = req.userId

        if (!validator.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, message: "UserId is invalid" });
        }

        let data = req.body

        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, message: "Please enter your details to place an order" })   //validating the parameters of body
        }
        
        const {cartId, cancellable, status} = data

        const findingUser = await userModel.findById(userIdFromParams)
        if(!findingUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        if (userIdFromToken != userIdFromParams) {
            return res.status(403).send({ status: false, message: "Unauthorized access." });
        }

        if(!validator.isValidValue(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide the cartId" })
        }
        if(!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "CartId is invalid" })
        }
        const findCart = await cartModel.findById(cartId)
        if(!findCart) {
            return res.status(404).send({ status: false, message: "Cart not found" })
        }
        if(findCart.userId != userIdFromParams){
            return res.status(400).send({ status: false, message: "With this user cart is not created" });
        }
        if(findCart.items.length === 0) {
            return res.status(400).send({ status: false, message: "User cart is empty." })  //verifying whether the cart is having any products or not.
        }

        if(cancellable){
            if(typeof(cancellable != 'boolean')){
                return res.status(400).send({status:false, message: "Cancellable should be a valid boolean value."})
            }
        }

        if(status){
            if(!validator.isValidStatus(status)){
                return res.status(400).send({status:false, message: "Valid status is required. [completed, pending, cancelled]"})
            }
        }

        let totalQuantityInCart = 0 
        for(let i=0; i<findUserCart.items.length; i++){
            totalQuantityInCart += findUserCart.items[i].quantity
        }
        
        const newOrder = {
            userId : userIdFromParams,
            items : findCart.items,
            totalPrice : findCart.totalPrice,
            totalItems : findCart.totalItems,
            totalQuantity: totalQuantityInCart,
            cancellable,
            status
        }

        await cartModel.findOneAndUpdate({ _id: cartId}, {$set: {items: [], totalPrice: 0, totalItems: 0,} });

        let saveOrder = await orderModel.create(newOrder)
        return res.status(201).send({status:true, message:"Order placed successfully", data:saveOrder})
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}

// -----------updateOrder-----------------------------------------------------------------------------------
const updateOrder = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }
        
        const userIdFromParams = req.params.userId
        
        const userIdFromToken = req.userId
        
        if (!validator.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, message: "UserId is invalid" });
        }
        const findUser = await userModel.findById(userIdFromParams);
        if (!findUser) {
            return res.status(404).send({ status: false, message: 'User not found.' });
        }
        if (userIdFromToken != userIdFromParams) {
            return res.status(403).send({ status: false, message: "Unauthorized access." });
        }
        
        let data = req.body
        
        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, message: "Please enter your details to update." })   //validating the parameters of body
        }
        const {orderId, status} = data
        
        if (!validator.isValidValue(orderId)) {
            return res.status(400).send({ status: false, messege: "Please provide OrderId" })
        }
        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "ProductId is invalid" });
        }
        const findOrder = await orderModel.findById(orderId);
        if (!findOrder) {
            return res.status(400).send({ status: false, message: 'Order Id is incorrect.' });
        }

        // if (findOrder.totalPrice === 0) {
        //     return res.status(404).send({ status: false, message: 'No order has been placed' });
        // }

        if(!validator.isValidStatus(status)){
            return res.status(400).send({status:false, message: "Valid status is required. [completed, pending, cancelled]"})
        }

        if(status === 'pending'){
            if(findOrder.status === 'completed'){
                return res.status(400).send({status:false, message: "Order can not be updated to pending. because it is completed."})
            }
            if(findOrder.status === 'cancelled'){
                return res.status(400).send({status:false, message: "Order can not be updated to pending. because it is cancelled."})
            }
            if(findOrder.status === 'pending'){
                return res.status(400).send({status:false, message: "Order is already pending."})
            }
        }

        if(status === 'completed'){
            if(findOrder.status === 'cancelled'){
                return res.status(400).send({status:false, message: "Order can not be updated to completed. because it is cancelled."})
            }
            if(findOrder.status === 'completed'){
                return res.status(400).send({status:false, message: "Order is already completed."})
            }
            const orderStatus = await orderModel.findOneAndUpdate({ _id: orderId}, 
                {$set: { items: [], totalPrice: 0, totalItems: 0, totalQuantity: 0, status }},{new:true});
            return res.status(200).send({status: true, message: "order completed successfully", data: orderStatus})
        }

        if(status === 'cancelled'){
            if(findOrder.cancellable == false){
                return res.status(400).send({status:false, message:"Item can not be cancelled, because it is not cancellable."})
            }
            if(findOrder.status === 'cancelled'){
                return res.status(400).send({status:false, message: "Order is already cancelled."})
            }
            const findOrderAfterDeletion = await orderModel.findOneAndUpdate({ userId: userIdFromParams },
                {$set: {items: [], totalPrice: 0, totalItems: 0, totalQuantity : 0, status : 'cancelled' }},{new:true})
            return res.status(200).send({status: true, message: "Order is cancelled successfully", data: findOrderAfterDeletion})
        }
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}

module.exports = { createOrder, updateOrder };
