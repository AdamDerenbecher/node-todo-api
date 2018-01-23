const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [{
  _id: userOneId,
  email: 'userOne@example.com',
  password: 'randomPass123!',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, 'abc123').toString()
  }]
}, {
  _id: userTwoId,
  email: 'userTwo@example.com',
  password: 'randomPass456!'
}];

const todos = [{
                _id: new ObjectID(),
                text: 'first test todo',
                completed: false
              },
              {
                _id: new ObjectID(),
                text: 'second test todo',
                completed: false
              },
              {
                _id: new ObjectID(),
                text: 'third test todo',
                completed: true,
                completedAt: 333
              }];

const populateTodos = (done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos); //return so we can chain
  }).then(() => done());
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();
    return Promise.all([userOne, userTwo])
  }).then(() => done());
};

module.exports = {todos, populateTodos, users, populateUsers};
