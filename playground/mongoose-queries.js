const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

// var id = "5a6215e244a27946bd2fb411";
//
// if (!ObjectID.isValid(id)){
//   console.log('Id is not valid');
// } else {
//   Todo.find({
//     _id: id //mongoose converts string to object for you!
//   }).then((todos) => {
//     console.log('Todos', todos);
//   });
//
//   Todo.findOne({
//     _id: id //mongoose converts string to object for you!
//   }).then((todo) => {
//     console.log('Todo', todo);
//   });
//
//   Todo.findById(id).then((todo) => {
//     if (!todo) {
//       return console.log('Todo not found'); //don't allow other code to run
//     }
//     console.log('Todo', todo);
//   }).catch((e) => {
//     console.log(e);
//   });
// }

var userId = "5a6105490a88ed53a4c21a5a";

if (!ObjectID.isValid(userId)){
  console.log('Id is not valid');
} else {
  User.findById(userId).then((user) => {
    if (!user) {
      return console.log('User not found');
    }
    console.log('User', user);
  }).catch((e) => {
    console.log(e);
  });
}
