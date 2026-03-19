
require('dotenv').config()
const mongoose = require('mongoose')


mongoose.connect(process.env.MONGO_URL)

const userSchema = mongoose.Schema({
    userName: {
        type:String,
        unique: true 
    },
    email: {
        type:String,
        unique: true 
    },
    isVerified: { type: Boolean, default: false },
    verifyToken: String,
    password: String,
    resetToken: String,
    resetTokenExpiry: Date,
    avatar : String,
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    analys: [{ type: mongoose.Schema.Types.ObjectId, ref: 'analys' }]
})

module.exports  =  mongoose.model("user",userSchema)