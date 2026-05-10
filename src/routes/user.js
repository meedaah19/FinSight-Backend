import express from 'express';
import User from '../models/user.js';
import { auth } from '../middlewares/auth.js';
import Expense from "../models/expenses.js";

const router = new express.Router() 

router.get('/user/profile', auth, async(req, res) => {
  try{
    const token = req.header('Authorization').replace('Bearer ', '');
    const user = await User.findOne({ 'tokens.token': token });
    if (!user) {
      return res.status(401).send({error: 'Please authenticate'})
    }
    return res.send(user);
  }catch(error){
    res.status(500).send({error: 'Error occurred while fetching user data'})
  }
})

router.post('/user/signup', async(req, res) => {
  try{
    const user = new User(req.body);

    await user.save();
    const token = await user.generateAuthToken();
    return res.status(201).send({message: 'User created successfully', user, token})
  }catch(error){
    res.status(400).send({error: error.message})
  }
});

router.post('/user/login', async(req, res) => {
  try {
    const user = await 
    User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    return res.send({message: 'Login successful', user, token})

  } catch (error) {
    res.status(400).send({error: 'Invalid email or password'})
  }
});

router.post('/user/logout', async(req, res) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  try {
    await User.updateOne({token}, {$pull: {tokens: {token}}});
    return res.send({message: 'Logout successful'});
  } catch (error) {
    res.status(500).send({error: 'Error occurred while logging out'});
  }
});

router.patch('/user/profile', auth, async(req, res) => {
    try{
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'email', 'password', 'phoneNumber', 'budget'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            return res.status(400).send({error: 'Invalid updates'});
        }

        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();

        return res.send(req.user);
    }catch(e){
        res.status(400).send(e);
    }
});

router.post("/user/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );

    await req.user.save();

    return res.send({
      message: "Logout successful",
    });

  } catch (e) {
    res.status(500).send({
      error: "Error occurred while logging out",
    });
  }
});


router.delete('/user/profile', auth, async(req,res) => {
  try{
    await Expense.deleteMany({ user: req.user._id });

    await User.findByIdAndDelete(req.user._id);

    return res.send({message: 'User deleted successfully', user: req.user});
  }catch(e){
    res.status(500).send({error: 'Error occurred while deleting user'})
  }
})

export {router}