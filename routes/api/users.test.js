const mongoose = require('mongoose');
const request = require('supertest');
require('dotenv').config();

const { DB_HOST_TEST } = process.env;
const app = require('../../app');

describe('test users', () => {
  let server;
  beforeAll(() => (server = app.listen(3000)));
  afterAll(() => server.close());

  beforeEach(done => {
    mongoose.connect(DB_HOST_TEST).then(() => done());
  });

  afterEach(done => {
    mongoose.connection.close(() => done());
  });

  test('test login route', async () => {
    const loginDate = {
      
    };
    const response = await request(app)
      .post('/api/users/login')
      .send(loginDate);

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBeTruthy();
    expect(response.body.user.subscription).toBeTruthy();
    expect(response.body.user.email).toMatch(/\w/);
    expect(response.body.user.subscription).toMatch(/\w/);
    // [^A-Za-z0-9_] === /\w/ - регулярное виражение https://developer.mozilla.org/ru/docs/Web/JavaScript/Guide/Regular_Expressions
  });
});
