const orderModel = require("../models/orderModel.js");
const cartModel = require("../models/cartModel.js");
const productModel = require("../models/productModel.js");
const userModel = require("../models/userModel.js");
const validator = require('../utils/validator.js');
const awsConfig = require('../utils/awsConfig')
const jwt = require('jsonwebtoken');




// -----------createOrder-----------------------------------------------------------------------------------
const createOrder = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, msg: "Invalid params present in URL"})
        }

        let data = req.body
        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, msg: "Please enter your details to place an order" })   //validating the parameters of body
        }
        const userIdFromParams = req.params.userId
        const userIdFromToken = req.userId

        if (!validator.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, msg: "UserId is invalid" });
        }
        
        const { productId, quantity, cancellable, status } = data

        const findingUser = await userModel.findById(userIdFromParams)
        if(!findingUser) {
            return res.status(404).send({ status: false, msg: "User not found" })
        }
        if (userIdFromToken != userIdFromParams) {
            return res.status(403).send({ status: false, message: "Unauthorized access." });
        }

        if(!validator.isValidValue(productId)) {
            return res.status(400).send({ status: false, msg: "Please provide ProductId" })
        }
        if(!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "ProductId is invalid" })
        }
        const findProduct = await productModel.findById(productId)
        if(!findProduct) {
            return res.status(404).send({ status: false, msg: "Product not found" })
        }
        if(findProduct.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "Product is deleted." })
        }
        if (!validator.isValidValue(quantity)) {
            return res.status(400).send({ status: false, messege: "please provide quantity" })
        }
        if ((isNaN(Number(quantity)))) {
            return res.status(400).send({status:false, message: 'quantity should be a valid number' })         //price should be valid number
        }
        if (quantity <= 0) {
            return res.status(400).send({status:false, message: 'quantity can not be less than or equal to zero' })    //price should be valid number
        }
        const findUserCart = await cartModel.findOne({userId : userIdFromParams});

        if(!findUserCart){
            return res.status(404).send({status:false, message:"user's cart not found."})
        }

        if(findUserCart.items.length === 0){
            return res.status(400).send({status:false, message:"User cart is empty."})
        }

        if(cancellable){
            if((cancellable != true) && (cancellable != false)){
                return res.status(400).send({status:false, message:"cancellable should be a valid boolean value."})
            }

        }

        if(!validator.isValidStatus(status)){
            return res.status(400).send({status:false, message:"valid status is required. [completed, pending, cancelled]"})
        }

        const isOrderPlaceEarlier = await orderModel.findOne({userId : userIdFromParams});

        if(!isOrderPlaceEarlier){
            const newOrder = {
                userId : userIdFromParams,
                items : [{
                    productId : productId,
                    quantity : quantity
                }],
                totalPrice : (findProduct.price)*quantity,
                totalItems : 1,
                totalQuantity : quantity,
                cancellable : cancellable,
                status : status
            }
            const saveOrder= await orderModel.create(newOrder)
            return res.status(201).send({status:true, message:"Order saved successfully", data:saveOrder})
        }

        if(isOrderPlaceEarlier){
            const items = isOrderPlaceEarlier.items
            const newTotalPrice = (isOrderPlaceEarlier.totalPrice) + ((findProduct.price)*quantity)
            let countTotalQuantity = 0
            let flag = 0
            
            for(let i=0; i<items.length; i++){
                countTotalQuantity += items[i].quantity
            }

            for(let i=0; i<items.length; i++){
                if(items[i].productId.toString() === productId){
                    console.log("productIds are similar")
                    items[i].quantity += quantity
                    var newOrderData = {
                        items : items,
                        totalPrice : newTotalPrice,
                        totalItems : items.length,
                        totalQuantity : (countTotalQuantity+quantity),
                        cancellable : cancellable,
                        status : status
                    }
                    flag = 1
                    const saveData = await orderModel.findOneAndUpdate({userId : userIdFromParams}, newOrderData, {new:true})
                    return res.status(201).send({status:true, message:"Order added successfully", data:saveData})
                }
            }

            if(flag === 0){
                console.log("productIds are not similar")
                let addItems = { productId : productId, quantity : quantity }
                const saveData = await orderModel.findOneAndUpdate( {userId : userIdFromParams},
                {$addToSet : {items : addItems}, $inc :
                {totalItems : 1, totalPrice: ((findProduct.price)*quantity), totalQuantity:quantity}},
                {new:true, upsert:true})
                return res.status(201).send({status:true, message:"order added successfully", data:saveData})
            }
        }
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}

// -----------updateOrder-----------------------------------------------------------------------------------
const updateOrder = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, msg: "Invalid params present in URL"})
        }

        let data = req.body
        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, msg: "Please enter your details to update." })   //validating the parameters of body
        }

        const userIdFromParams = req.params.userId
        const userIdFromToken = req.userId
        
        const {orderId, status} = data

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

        if (!validator.isValidValue(orderId)) {
            return res.status(400).send({ status: false, messege: "Please provide OrderId" })
        }

        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, msg: "ProductId is invalid" });
        }

        const findOrder = await orderModel.findById(orderId);
        
        if (!findOrder) {
            return res.status(400).send({ status: false, message: 'Order Id is incorrect.' });
        }

        if (findOrder.totalPrice === 0) {
            return res.status(404).send({ status: false, message: 'No order has been placed' });
        }

        if(!validator.isValidStatus(status)){
            return res.status(400).send({status:false, message:"valid status is required. [completed, pending, cancelled]"})
        }

        if(status === 'cancelled'){
            if(findOrder.cancellable == false){
                return res.status(400).send({status:false, message:"Item can not be cancelled, because it is not cancellable."})
            }

            await orderModel.findOneAndUpdate(
                { userId: userIdFromParams },
                {$set: {
                    items: [],
                    totalPrice: 0,
                    totalItems: 0,
                    totalQuantity : 0
                }
            })
            const findOrderAfterDeletion = await orderModel.findOne({ userId: userIdFromParams })   
            return res.status(200).send({status: true, message: "order cancelled successfully", data:findOrderAfterDeletion})
        }

        const updateOrder = await orderModel.findOneAndUpdate(
            { userId: userIdFromParams },
            {$set: { status: status }},
            {new:true})
            return res.status(200).send({status: true, message: "order status updates successfully", data:updateOrder})
    }
    catch(err) {
        console.log(err)
        res.status(500).send({msg: err.message})
    }
}

module.exports = { createOrder, updateOrder };
