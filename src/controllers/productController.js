const productModel = require("../models/productModel.js");
const validator = require('../utils/validator.js');
const awsConfig = require('../utils/awsConfig')
const currencySymbol = require("currency-symbol-map")  //to lookup the currency symbol for a given currency code


// -----------createProduct-----------------------------------------------------------------------------------
const createProduct = async function(req, res) {
    try{
        let data = req.body
        
        if (!validator.isValidDetails(data)){
            return res.status(400).send({status: false, message: "Please enter your details to Create Product"})   //validating the parameters of body
        }
        
        let { title, description, price, currencyId, currencyFormat, availableSizes, isFreeShipping, installments, style } = data
        
        if (!validator.isValidValue(title)){
            return res.status(400).send({status:false, message: "Please provide the title"})   //title is mandory 
        }
        const titleUsed = await productModel.findOne({title})    //title is unique
        if(titleUsed){
            return res.status(400).send({status:false, message:`${title} is already exists`})   //checking the title is already exist or not.
        }
        if (!validator.isValidValue(description)){
            return res.status(400).send({status:false, message: "Please provide the description"})   //description is mandory 
        }
        if (!validator.isValidValue(price)){
            return res.status(400).send({status:false, message: "Please provide the price"})   //price is mandory
        }
        if (!(!isNaN(Number(price)))) {
            return res.status(400).send({ status: false, message: 'Price should be a valid number' })
        }
        if(!validator.isValidValue(currencyId)){
            return res.status(400).send({status:false, message: "Please provide the currencyId"})    //currencyId is mandory 
        }
        if (currencyId != "INR") {
            return res.status(400).send({status: false, message: "CurrencyId should be INR"})   //INR currency accepted in CurrencyId
        }
        currencyFormat = currencySymbol('INR')  //using CurrencySymbolMap package here

        if (!validator.isValidValue(availableSizes)){
            return res.status(400).send({status:false, message:"Please provide the availableSizes"})   //availableSizes is mandory
        }

        let sizeEnum = availableSizes.split(",").map(x => x.trim())

        for (let i = 0; i < sizeEnum.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeEnum[i]))) {
                return res.status(400).send({status: false, message: `Available Sizes must be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
            }
        }
        if (!validator.isValidSize(availableSizes)){
            return res.status(400).send({status:false, message:"Please provide the size in S, XS, M, X, L, XXL, XL "})   //Enum handeling in availableSizes
        }
        if(installments){
            if (!validator.validInstallment(installments)) {
                return res.status(400).send({status: false, message: "Installments can not be a decimal number "})    
            }
        }
        if(isFreeShipping) {
            if (!(isFreeShipping != true)) {
                return res.status(400).send({ status: false, message: "isFreeShipping must be a true or false." })
            }
        }
        
        let files = req.files
        if (files && files.length > 0) {      
            var productImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
        }
        else {
            return res.status(400).send({ status: false, message: "Please upload your Product Image" })   //Product Image is mandory
        }
        
        const product = { title, description, price, currencyId, currencyFormat, isFreeShipping, 
                    productImage, style, availableSizes: sizeEnum, installments }
        
       let productData = await productModel.create(product)      //If all these validations passed , creating a product
            return res.status(201).send({status: true , message: "New Product created successfully", data: productData })
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}


// -----------getAllProducts-----------------------------------------------------------------------------------
const getAllProducts = async function(req, res) {
    try{
        const query = req.query

        const filter = { isDeleted: false } //complete object details.

        const { size, name, priceGreaterThan, priceLessThan, sortPrice } = query

        if(validator.isValidValue(size)){
            if (size) {
                let asize = size.split(",").map(x => x.trim())
                for (let i = 0; i < asize.length; i++) {
                    if (["S", "XS", "M", "X", "L", "XXL", "XL"].includes(asize[i])) {
                        filter['availableSizes'] = asize
                    }
                }
            }
            filter['availableSizes'] = size
        }

        //using $regex to match the subString of the names of products & "i" for case insensitive.
        if(validator.isValidValue(name)){     
            filter['title'] = {}
            filter['title']['$regex'] = name        //samsung galaxy user: GALAXY
            filter['title']['$options'] = '$i'      //case insensitive
        }

        if(validator.isValidValue(priceGreaterThan)){       //setting price for ranging the product's price to fetch them.
            if (!(!isNaN(Number(priceGreaterThan)))) {
                return res.status(400).send({status:false, message: 'Price should be a valid number' })   
            }
            if (priceGreaterThan < 0) {
                return res.status(400).send({status:false, message: 'Price can not be less than zero' })
            }
            if (!Object.prototype.hasOwnProperty.call(filter, 'price'))     // checking if "price" exists
                filter['price'] = {}                               //creating empty object
                filter['price']['$gte'] = Number(priceGreaterThan)      //using mongoose operator
        }

        if(validator.isValidValue(priceLessThan)){      //setting price for ranging the product's price to fetch them.
            if (!(!isNaN(Number(priceLessThan)))) {
                return res.status(400).send({status:false, message: 'Price should be a valid number' })   
            }
            if (priceLessThan <= 0) {
                return res.status(400).send({status:false, message: 'Price can not be zero or less than zero' })
            }
            if (!Object.prototype.hasOwnProperty.call(filter, 'price'))     // checking if "price" exists
                filter['price'] = {}                                 //creating empty object
                filter['price']['$lte'] = Number(priceLessThan)             //using mongoose operator
        }

        if(validator.isValidValue(sortPrice)) {       //sorting the products acc. to prices => 1 for ascending & -1 for descending.
            if (!((sortPrice == 1) || (sortPrice == -1))) {
                return res.status(400).send({status: false, message: 'SortPrice should be 1 or -1 '})
            }
            const products = await productModel.find(filter).sort({ price: sortPrice })
            if (products.length === 0) {
                return res.status(404).send({ productStatus: false, message: 'No Product found' })
            }
            return res.status(200).send({status: true, message: 'Product list', data: products })
        }

        const products = await productModel.find(filter)
        if (products.length === 0) {
            return res.status(404).send({ Status: false, message: 'No Product found' })
        }
            return res.status(200).send({status: true, message: 'Product list', data: products })
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}


// -----------get Product By ID-----------------------------------------------------------------------------------
const getProductById = async (req, res) => {
    try{
        const query = req.query

        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }

        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not valid type Product Id`});
        }

        const findProduct = await productModel.findOne({_id: productId, isDeleted: false})
        if (!findProduct) {
            return res.status(404).send({ status: false, message: 'Product does not exists' })  //Validate: The Product Id is valid or not.
        }
        if(findProduct.isDeleted == true){
            return res.status(400).send({ status:false, message: "Product is deleted" });
        }
        return res.status(200).send({ status: true, message: 'Product found successfully', data: findProduct })
    }
    catch(error){
        console.log(err)
        res.status(500).send({message: err.message})
    }
}


// -----------updateProduct-----------------------------------------------------------------------------------
const updateProduct = async function(req, res) {
    try{
        const query = req.query

        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }

        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "ProductId is invalid" });
        }
        
        const findProduct = await productModel.findById(productId)
        if (!findProduct) {
            return res.status(404).send({ status: false, message: 'Product does not exists' })
        }        
        if(findProduct.isDeleted == true){
            return res.status(400).send({ status:false, message: "Product is deleted" });
        }

        let data = req.body

        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, message: "Please enter your details to Update" })   //validating the parameters of body
        }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, productImage, availableSizes, installments } = data

        if(title){
            if (!validator.isValidValue(title)) {
                return res.status(400).send({ status: false, messege: "Title can not be an empty." })
            }
            const isDuplicateTitle = await productModel.findOne({title});
            if (isDuplicateTitle) {
                return res.status(400).send({status: false,message: "Title is already exists.",})
            }
        }
        
        if(description){
            if (!validator.isValidValue(description)) {
                return res.status(400).send({ status: false, message: "Description can not be an empty." });
            }
        }

        if(price){
            if (!validator.isValidValue(price)) {
                return res.status(400).send({ status: false, messege: "Price can not be empty." })
            }
            if (!(!isNaN(Number(price)))) {
                return res.status(400).send({ status: false, message: 'Price should be a valid number' })
            }
            if (price <= 0) {
                return res.status(400).send({ status: false, message: 'Price can not be zero or less than zero.' })
            }
        }

        if(currencyId){
            if (!validator.isValidValue(currencyId)) {
                return res.status(400).send({ status: false, messege: "CurencyId can not be empty." })
            }
            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, message: 'CurrencyId should be a INR' })
            }
        }

        if(isFreeShipping){
            if (!validator.isValidValue(isFreeShipping)) {
                return res.status(400).send({ status: false, messege: "isFreeShipping can not be empty." })
            }
            if (!((isFreeShipping === true) || (isFreeShipping === false))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }
        }
        if(productImage) {
            let files = req.files
            if (files && files.length > 0) {     
                var image = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
            }
        }
            
        if(style){
            if (!validator.isValidValue(style)) {
                return res.status(400).send({ status: false, messege: "Styles can not be empty." })
            }
        }
        
        if(availableSizes){
            if (!validator.isValidSize(availableSizes)) {
                return res.status(400).send({ status: false, message: "Please provide valid size." }); //Enum is mandory
            }
            let sizeArray = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < sizeArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeArray[i]))) {
                    return res.status(400).send({ status: false, message: `Available Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
            }
        }

        if(installments){
            if (!validator.isValidValue(installments)) {
                return res.status(400).send({ status: false, messege: "Installments can not be empty." })
            }
            
            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, message: 'Installments should be a valid number' })
            }
        }
        
        const dataToUpdate = { title, description, price, currencyId, currencyFormat, 
                    isFreeShipping, productImage, style, availableSizes, installments }
        
        const updatedProduct = await productModel.findOneAndUpdate( { _id: productId }, dataToUpdate , { new: true, upsert: true } );
        
            res.status(200).send({ status: true, message: "Product details updated successfully", data: updatedProduct });
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}

// -----------deleteProduct-----------------------------------------------------------------------------------
const deleteProduct = async function(req, res) {
    try{
        const query = req.query

        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }
                
        const productId = req.params.productId

        if(productId){
            if(!validator.isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: "ProductId is invalid"})
            }
            const findProduct = await productModel.findById(productId)
            if(!findProduct) {
                return res.status(404).send({ status: false, message: "Product does not exist"})
            }
            if(findProduct.isDeleted == true) {
                return res.status(400).send({ status: false, message: "Product is already deleted"})
            }
        }

        const deletedProduct = await productModel.findOneAndUpdate({_id: productId}, 
            {$set: {isDeleted: true, deletedAt: new Date()}}, {new: true} )

            return res.status(200).send({ status: true, message: 'Product deleted successfully.', data: deletedProduct })

    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
