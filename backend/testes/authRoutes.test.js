const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const expect = chai.expect;
chai.use(chaiHttp);

const app = require('../server'); // assuming your Express app is exported from server.js
const User = require('../src/controllers/models/User');

describe('Auth Routes', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await User.deleteMany({});
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const newUser = { username: 'testuser', password: 'password' };
      const res = await chai.request(app)
        .post('/register')
        .send(newUser);
      expect(res).to.have.status(201);
      expect(res.body).to.have.property('message').equal('User registered successfully');
    });

    it('should not register a user with existing username', async () => {
      const existingUser = new User({ username: 'existinguser', password: await bcrypt.hash('password', 10) });
      await existingUser.save();
      
      const res = await chai.request(app)
        .post('/register')
        .send({ username: 'existinguser', password: 'password' });
      
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message').equal('Username already exists');
    });
  });

  describe('POST /login', () => {
    it('should log in an existing user with correct credentials', async () => {
      const password = await bcrypt.hash('password', 10);
      const existingUser = new User({ username: 'existinguser', password });
      await existingUser.save();

      const res = await chai.request(app)
        .post('/login')
        .send({ username: 'existinguser', password: 'password' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
    });

    it('should not log in a user with incorrect password', async () => {
      const password = await bcrypt.hash('password', 10);
      const existingUser = new User({ username: 'existinguser', password });
      await existingUser.save();

      const res = await chai.request(app)
        .post('/login')
        .send({ username: 'existinguser', password: 'wrongpassword' });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message').equal('Invalid credentials');
    });

    it('should not log in a non-existing user', async () => {
      const res = await chai.request(app)
        .post('/login')
        .send({ username: 'nonexistinguser', password: 'password' });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message').equal('Invalid credentials');
    });
  });
});
