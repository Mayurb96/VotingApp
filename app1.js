var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var mysql = require('mysql2');
var bcrypt = require('bcrypt');

var app = express();

// MySQL database connection setup
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ySqu@d123',
  database: 'java'
});

connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// view engine setup
app.engine('hbs',
  hbs.engine({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/'
  })
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/', function(req, res) {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], function(err, results) {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.render('index', { error: 'An error occurred. Please try again later.' });
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.password, function(err, isPasswordValid) {
        if (err) {
          console.error('Error comparing passwords:', err);
          res.render('index', { error: 'An error occurred. Please try again later.' });
          return;
        }

        if (isPasswordValid) {
          res.redirect('/vote');
        } else {
          res.render('index', { error: 'Invalid username or password' });
        }
      });
    } else {
      res.render('index', { error: 'Invalid username or password' });
    }
  });
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', function(req, res) {
  const { username, password, email, phone } = req.body;
  bcrypt.hash(password, 10, function(err, hashedPassword) {
    if (err) {
      console.error('Error hashing password:', err);
      res.render('register', { error: 'An error occurred. Please try again later.' });
      return;
    }

    const query = 'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)';
    connection.query(query, [username, hashedPassword, email, phone], function(err, results) {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.render('register', { error: 'An error occurred. Please try again later.' });
        return;
      }

      res.redirect('/');
    });
  });
});

app.get('/vote', function(req, res) {
  res.render('vote');
});

app.post('/vote', function(req, res) {
  const { candidate } = req.body;
  const query = 'INSERT INTO votes (candidate) VALUES (?)';
  connection.query(query, [candidate], function(err, results) {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.render('vote', { error: 'An error occurred. Please try again later.' });
      return;
    }

    res.redirect('/');
  });
});

app.get('/admin', function(req, res) {
  const query = 'SELECT COUNT(*) AS voteCount FROM votes';
  connection.query(query, function(err, results) {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.render('admin', { error: 'An error occurred. Please try again later.' });
      return;
    }

    const voteCount = results[0].voteCount;
    res.render('admin', { voteCount });
  });
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