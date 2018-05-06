let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should()
const {miscConstants} = require('./../routes/api/APIConstants/misc.constants');
const {userConstants} = require('../routes/api/APIConstants/user.constants');
const {memoryConstants} = require('./../routes/api/APIConstants/memory.constants');
const config = require('config.json')('./config.json');

const db = require('./../db_conn');
const DbHelper = require('../helper/db.helper');

chai.use(chaiHttp);

describe('Memory API endpoint /memory', (done) => {

  /* Clean database before testing */
  before((done) => {
    DbHelper.clearDatabase();
    done();
  });

  it('should not retrieve memory without TOKEN', (done) => {
    chai.request(server)
        .get('/api/memory')
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.have.property('message').eql(miscConstants.MISSING_TOKEN);
          res.body.should.have.property('auth').eql(false);
          done()
        })
  });

  it('should CREATE a user in the databse', (done) => {
    let user = {
      firstName: 'Bob',
      lastName: 'Kong',
      username: 'Bkong',
      password: 'abc123',
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

  it('should create a memory by an authenticated user', (done) => {
    let user = {
      username: 'Bkong',
      password: 'abc123'
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
              .post('/api/memory')
              .set('authorization-token', token)
              .field('location', 'Toronto')
              .field('description', 'Toronto Islands')
              .attach('image', config.refs + '/image.jpg', 'image.jpg')
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('message').eql(memoryConstants.CREATE_SUCCESS);
                res.body.should.have.property('success').eql(true);
                done()
              })
        });
  });

  it('should get the memories by an authenticated user', (done) => {
    let user = {
      username: 'Bkong',
      password: 'abc123'
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
              .get('/api/memory')
              .set('authorization-token', token)
              .end((err, res) => {
                let memory = res.body.memory[0];
                res.should.have.status(200);
                memory.should.have.property('location').eql('Toronto');
                memory.should.have.property('user').eql('Bkong');
                memory.should.have.property('description').eql('Toronto Islands');
                done()
              })

        });
  });

})