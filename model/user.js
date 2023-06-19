var mongoose =require('mongoose');


const userSchema=new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    phone: Number
  });
  
  const User=mongoose.model('User',userSchema);
  
  module.export=user=mongoose.model('User',userSchema);