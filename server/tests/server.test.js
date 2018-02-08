const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {
          expect(todos.length).toBe(3);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('should return all of the todos', (done) => {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
         expect(res.body.todo.text).toBe(todos[0].text);
       })
       .end((err, res) => {
         if (err) {
           console.log(res);
           return done(err);
         }
         done();
       });
  });

  it('should not return todo doc created by other user', (done) => {
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 when todo not found', (done) => {
    var badTodoId = new ObjectID().toHexString();
    request(app)
      .get(`/todos/${badTodoId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for bad ObjectIDs', (done) => {
    request(app)
      .get('/todos/123')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
    var id = todos[0]._id.toHexString();
    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(id);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(id).then((todo) => {
          expect(todo).toBeFalsy();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not remove a todo created by someone else', (done) => {
    var id = todos[1]._id.toHexString();
    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(id).then((todo) => {
          expect(todo).toBeTruthy();
          done();
        }).catch((e) => done(e));
      });
  });


  it('should return 404 when todo not found', (done) => {
    var badTodoId = new ObjectID().toHexString();
    request(app)
      .delete(`/todos/${badTodoId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for bad ObjectIDs', (done) => {
    request(app)
      .delete('/todos/123')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    var id = todos[2]._id.toHexString();
    var newText = 'changed in test';
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({
        text: newText,
        completed: true
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(id);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(id).then((todo) => {
          expect(todo.text).toBe(newText);
          expect(todo.completed).toBe(true);
          // expect(todo.completedAt).toBeA('number');
          expect(typeof res.body.todo.completedAt).toBe('number');
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not update the todo created by another user', (done) => {
    var id = todos[1]._id.toHexString();
    var newText = 'changed in test';
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({
        text: newText,
        completed: true
      })
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(id).then((todo) => {
          expect(todo.text).not.toBe(newText);
          expect(todo.completed).not.toBe(true);
          expect(todo.completedAt).toBeFalsy();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should clear completedAt when todo is not completed', (done) => {
    var id = todos[2]._id.toHexString();
    var newText = 'changed in test2';
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({
        text: newText,
        completed: false
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(id);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(id).then((todo) => {
          expect(todo.text).toBe(newText);
          expect(todo.completed).toBe(false);
          expect(todo.completedAt).toBeFalsy();
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /users/me', () => {
   it('should return user if authenticated', (done) => {
     request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
   });

   it('should return a 401 if not authenticated', (done) => {
     request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
   });
});

describe('POST /users/', () => {
  it('should create a user', (done) => {
    var email = 'test@testemail.com';
    var password = 'testPass123!';
    request(app)
      .post('/users/')
      .send({
        email,
        password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({
          email
        }).then((user) => {
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(password);
          done();
        });
      });
  });

  it('should return validation errors if request invalid', (done) => {
    var email = 'test@testemailcom';
    var password = 'test';
    request(app)
      .post('/users/')
      .send({
        email,
        password
      })
      .expect(400)
      done();
  });

  it('should not create user if email in use', (done) => {
    var email = users[0].email; //use one already in use from seeded data
    var password = 'testPass123!';
    request(app)
      .post('/users/')
      .send({
        email,
        password
      })
      .expect(400)
      done();
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toBeTruthy();
      })
      .end((err,res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((thisUser) => {
          expect(thisUser.toObject().tokens[1]).toMatchObject({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        }).catch((e) => {
          done(e);
        })
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        expect(res.header['x-auth']).toBeFalsy();
      })
      .end((err,res) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });
});



describe('DELETE /users/me/token', () => {

  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err,res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id).then((thisUser) => {
          expect(thisUser.tokens.length).toBe(0);
          done();
        }).catch((e) => {
          done(e);
        })
      });
  });
});
