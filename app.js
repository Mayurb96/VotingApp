var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var mongoose =require('mongoose');
var bcrypt=require('bcrypt');
var bodyParser=require('body-parser');

var app = express();


app.engine('hbs', 
hbs.engine({
 extname: 'hbs',
 defaultLayout: 'layout' , 
 layoutsDir: __dirname + '/views/layouts/'
 }));
 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://127.0.0.1:27017/votingAppDB',{   useNewUrlParser: true,
useUnifiedTopology: true
})
.then(()=> console.log('Connected to MongoDB'))
.catch(err=> console.log('Error connecting to MongoDB',err));

const userSchema=new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: Number
});

const User=mongoose.model('User',userSchema,'votingAppDB');

app.get('/', function(req, res) {
  res.render('index');
});


app.post('/', async function(req, res) {
  try{

  console.log('Login request received');
  const username=req.body.username;
  const password=req.body.password;
  const user=await User.findOne({ username });
  if(user){
    const isPasswordValid=await bcrypt.compare(password, user.password);
    if(isPasswordValid){
      res.redirect('/vote');
    }else{
      res.render('index',{ error: 'Invalid Username or Password'});
    }
  }else{
    res.render('index',{ error: 'Invalid Username or Password'});
  }
}catch(err){
  console.log(err);
}
});


app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', async function(req,res){

  try{
  const username=req.body.username;
  const password=req.body.password;
  const email=req.body.email;
  const phone=req.body.phone;
    const user=new User({
        username,
        password,
        email,
        phone
    });
    await user.save();
   
   await res.redirect('/');
  }
  catch(err){
    console.log(err);
  }
});


const voteSchema=new mongoose.Schema({
  candidate: String
});

const Vote=mongoose.model('Vote', voteSchema,'votingAppDB');

app.get('/vote', function(req, res, next) {
  res.render('vote');
});

app.post('/vote', async function(req,res,next){

  const { candidate }=req.body;

  const vote= new Vote({ candidate });
  await vote.save();

  res.redirect('/');
});



app.get('/admin', async function(req, res, next) {
  const voteCount=await Vote.countDocuments();
  res.render('admin', { voteCount })
});








// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
