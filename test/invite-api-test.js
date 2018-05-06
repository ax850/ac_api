let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should()

const db = require('./../db_conn');

const {userConstants} = require('../routes/api/APIConstants/user.constants');
const {inviteConstants} = require('../routes/api/APIConstants/invite.constants');
const expect = require('chai').expect;
const DbHelper = require('../helper/db.helper');

chai.use(chaiHttp);

describe('Invite API Endpoint /invite', function () {
  before((done) => {
    DbHelper.clearDatabase();
    done()
  });

  it ('should create a user that doesn\'t exist', (done) => {
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

          let user2 = {
            firstName: 'Bob',
            lastName: 'Kong',
            username: 'Bkong',
            password: 'test',
          };

          chai.request(server)
              .post('/api/users')
              .send(user2)
              .end((err, res) =>{
                res.should.have.status(200);
                res.body.should.have.property('message').eql(userConstants.CREATE_USER_SUCCESS);
                res.body.should.have.property('success').eql(true);
                done()
              });
        });
  });

  it ('should not invite a user that doesn\'t exist' , (done) => {

    let user = {
      username: 'ax850',
      password: 'test'
    };

    let to_user = {
      to_user: 'Does Not Exist'
    }

    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');

          let token = res.body.token;
          chai.request(server)
              .post('/api/invite')
              .set('authorization-token', token)
              .send(to_user)
              .end((err, res) => {
                res.should.have.status(401);
                res.body.should.have.property('message').eql(userConstants.DOES_NOT_EXIST);
                res.body.should.have.property('error').eql(true);
                done()
              })

        });
  });

  it ('should invite a user that does exist' , (done) => {
    let user = {
      username: 'ax850',
      password: 'test'
    };

    let to_user = {
      to_user: 'Bkong'
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
              .post('/api/invite')
              .set('authorization-token', token)
              .send(to_user)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true)
                res.body.should.have.property('message').eql(inviteConstants.CREATE_SUCCESS)
                done()
              })

        });
  });

  it ('should delete an existing invite', (done) => {
    let user = {
      username: 'ax850',
      password: 'test'
    };

    let to_user = {
      to_user: 'Bkong'
    }
    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');

          let token = res.body.token;
          chai.request(server)
              .post('/api/invite?action=cancel')
              .set('authorization-token', token)
              .send(to_user)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                res.body.should.have.property('message').eql(inviteConstants.DELETE_SUCCESS)
                done();
              })

        });
  })

  it ('should create an invite', (done) => {
    let user = {
      username: 'Bkong',
      password: 'test'
    };

    let to_user = {
      to_user: 'ax850'
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
              .post('/api/invite')
              .set('authorization-token', token)
              .send(to_user)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true)
                res.body.should.have.property('message').eql(inviteConstants.CREATE_SUCCESS)
                done()
              })

        });
  })

  it ('should accept an invite', (done) => {
    let user = {
      username: 'ax850',
      password: 'test'
    };

    let to_user = {
      to_user: 'Bkong'
    }
    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');

          let token = res.body.token;
          chai.request(server)
              .post('/api/invite?action=accept')
              .set('authorization-token', token)
              .send(to_user)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                res.body.should.have.property('message').eql(inviteConstants.ACCEPT_SUCCESS)
                done();
              })

        });
  })

  it ('should get one friend', (done) => {
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
              .get('/api/friends')
              .set('authorization-token', token)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.friends[0].should.have.property('username').eql('Bkong');
                res.body.friends[0].should.have.property('first_name').eql('Bob');
                res.body.friends[0].should.have.property('last_name').eql('Kong');
                done();
              })

        });
  })

  it ('should get one friend', (done) => {
    let user = {
      username: 'Bkong',
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
              .get('/api/friends')
              .set('authorization-token', token)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.friends[0].should.have.property('username').eql('ax850');
                res.body.friends[0].should.have.property('first_name').eql('Andy');
                res.body.friends[0].should.have.property('last_name').eql('Xu');
                done();
              })

        });
  });

  it ('should not create an invite for a user thats already a friend', (done) => {
    let user = {
      username: 'Bkong',
      password: 'test'
    };

    let to_user = {
      to_user: 'ax850'
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
              .post('/api/invite')
              .set('authorization-token', token)
              .send(to_user)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('message').eql(inviteConstants.ALREADY_FRIENDS)
                res.body.should.have.property('error').eql(true);
                done()
              })

        });
  })

  it ('should remove the friend', (done) => {
    let user = {
      username: 'Bkong',
      password: 'test'
    };

    let friend = {
      friend: 'ax850'
    }

    chai.request(server)
        .post('/api/authenticate')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');

          let token = res.body.token;
          chai.request(server)
              .post('/api/friends?action=remove')
              .send(friend)
              .set('authorization-token', token)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                done();
              })

        });
  });

  it ('should get no friends since it was just removed', (done) => {
    let user = {
      username: 'Bkong',
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
              .get('/api/friends')
              .set('authorization-token', token)
              .end((err, res) => {
                res.should.have.status(200);
                expect(res.body.friends).to.have.length(0);
                res.body.should.have.property('success').eql(true);
                done();
              })

        });
  })

});