let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

const db = require('./../db_conn');
const {userConstants} = require('../routes/api/APIConstants/user.constants');
const {miscConstants} = require('./../routes/api/APIConstants/misc.constants');
const DbHelper = require('../helper/db.helper');

chai.use(chaiHttp);

describe('User API endpoint /users', (done) => {

  /* Clean Database before Testing */
  before((done) => {
    DbHelper.clearDatabase();
    done();
  });

  it('should not retrieve profile WITHOUT TOKEN', (done) => {
    chai.request(server)
        .get('/api/users')
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.have.property('message').eql(miscConstants.MISSING_TOKEN);
          res.body.should.have.property('auth').eql(false);
          done()
        })
  });

  it('should not retrieve profile with INVALID TOKEN', (done) => {
    chai.request(server)
        .get('/api/users')
        .set('authorization-token', 'invalid-token')
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.have.property('message').eql(miscConstants.INVALID_TOKEN);
          res.body.should.have.property('auth').eql(false);
          done()
        })
  });

  it('should CREATE a user in the databse', (done) => {
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

  it('should retrieve profile from  an authenticated user from the database', (done) => {
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

          let token = res.body.token;
          chai.request(server)
              .get('/api/users')
              .set('authorization-token', token)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('profile');
                res.body.profile.should.have.property('first_name').eql('Andy');
                res.body.profile.should.have.property('last_name').eql('Xu');
                res.body.profile.should.have.property('username').eql('ax850');
                done()
              })

        });
  });

});