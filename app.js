let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let config = require('config.json')('./config.json');

let indexRouter = require('./routes/index');
let indexApi = require('./routes/api/index');
let authenticationApi = require('./routes/api/authentication');
let userRouter = require('./routes/api/users');
let memoryApi = require('./routes/api/memory');
let inviteApi = require('./routes/api/invite');
let friendApi = require('./routes/api/friends');

const app = express();
const port = process.env.PORT || '3001';    // Check ports
app.listen(port, function(){
  console.log('Running at localhost:' + port);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

/* For API use, set Access controls */
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  // Authorization Header Token //
  res.setHeader('Access-Control-Allow-Headers', 'Authorization-Token, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
//and remove cacheing so we get the most recent comments
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.use('/', indexRouter);
app.use('/api', indexApi);
app.use('/api/authenticate', authenticationApi);
app.use('/api/users', userRouter);
app.use('/api/memory', memoryApi);
app.use('/api/invite', inviteApi);
app.use('/api/friends', friendApi);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

});

module.exports = app;
