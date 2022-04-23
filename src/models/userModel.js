const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
    fname: {
        type: String, 
        required: true,
        trim: true
    },
    lname: {
        type: String, 
        required: true,
        trim: true
    },
    email: {
        type: String, 
        required: true,
        unique: true
    },
    profileImage: {
        type: String,
        required: true
    }, // s3 link
    phone: {
        type: String, 
        required: true,
        unique: true
    }, 
    password: {
        type: String, 
        required: true,
        minLen: [8, "Password length should not be less than 8"],
        maxLen: [15, "Password length should not be greater than 15"]
    }, // encrypted password
    address: {
      shipping: {
        street: {
            type: String, 
            required: true
        },
        city: {
            type: String, 
            required: true
        },
        pincode: {
            type: Number, 
            required: true
        }
      },
      billing: {
        street: {
            type: String, 
            required: true
        },
        city: {
            type: String, 
            required: true
        },
        pincode: {
            type: Number, 
            required: true
        }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema) 

