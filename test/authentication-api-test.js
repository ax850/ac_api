let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
const {authenticationConstants} = require('../routes/api/APIConstants/authentication.constants');
const {userConstants} = require('../routes/api/APIConstants/user.constants');
const db = require('./../db_conn');
const DbHelper = require('../helper/db.helper');

chai.use(chaiHttp);


describe('Authentication API endpoint /authenticate', function () {

  /* Clean Database before Testing */
  before((done) => {

    DbHelper.clearDatabase();
    done()
  });


  it('should not authenticate a user when no users in database', (done) => {

    let user = {
      username: 'ax850',
      password: 'test'
    };
    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('message').eql(authenticationConstants.USER_NOT_FOUND);
          res.body.should.have.property('error').eql(true);
          done();
        });

  });

  it('should CREATE a user in the database', (done) => {
    let user = {
      firstName: 'Andy',
      lastName: 'Xu',
      username: 'ax850',
      password: 'test',
    };

    chai.request(server)
        .post('/api/users')
        .send(user)
        .end((err, res) =>{
          res.should.have.status(200);
          res.body.should.have.property('message').eql(userConstants.CREATE_USER_SUCCESS);
          res.body.should.have.property('success').eql(true);
          done()
        });

  });

  it('should AUTHENTICATE a user from the database', (done) => {
    let user = {
      username: 'ax850',
      password: 'test'
    };

    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');
          done();
        });
  });

  it('should NOT AUTHENTICATE a user with wrong PASSWORD', (done) => {
    let user = {
      username: 'ax850',
      password: 'wrongpass'
    };

    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('error').eql(true);
          res.body.should.have.property('message').eql(authenticationConstants.WRONG_CRED);
          done();
        });

  });

  it('should NOT AUTHENTICATE a user with wrong USERNAME', (done) => {
    let user = {
      username: 'WrongUser',
      password: 'test'
    };

    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('error').eql(true);
          res.body.should.have.property('message').eql(authenticationConstants.USER_NOT_FOUND);
          done();
        });

  });

});