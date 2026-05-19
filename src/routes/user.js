import express from 'express';
import User from '../models/user.js';
import { auth } from '../middlewares/auth.js';
import Expense from "../models/expenses.js";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import sendResetEmail from "../email/account.js";

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
     return res.status(400).send({
      error: error.message
    });
  }
})

router.post('/user/signup', async(req, res) => {
  try{
    const user = new User(req.body);

    await user.save();
    const token = await user.generateAuthToken();
    return res.status(201).send({message: 'User created successfully', user, token})
  }catch(error){
    return res.status(400).send({error: error.message})
  }
});

router.post('/user/login', async(req, res) => {
  try {
    const user = await 
    User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    return res.send({message: 'Login successful', user, token})

  } catch (error) {
     return res.status(400).send({
      error: error.message
    });
  }
});

router.post('/user/logout', async(req, res) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  try {
    await User.updateOne({token}, {$pull: {tokens: {token}}});
    return res.send({message: 'Logout successful'});
  } catch (error) {
     return res.status(400).send({
      error: error.message
    });
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
      return res.status(400).send({
      error: error.message
    });
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
     return res.status(400).send({
      error: error.message
    });
  }
});


router.delete('/user/profile', auth, async(req,res) => {
  try{
    await Expense.deleteMany({ user: req.user._id });

    await User.findByIdAndDelete(req.user._id);

    return res.send({message: 'User deleted successfully', user: req.user});
  }catch(e){
     return res.status(400).send({
      error: error.message
    });
  }
});

router.post("/user/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const resetLink =
      `https://finsight-frontend-sooty.vercel.app/reset-password/${resetToken}`;

    // try sending email
    try {
      await sendResetEmail(user.email, resetLink);

      return res.send({
        message: "Reset link sent to email"
      });

    } catch (err) {
      console.error("Email failed:", err);

      return res.status(500).send({
        error: "Failed to send reset email"
      });
    }

  } catch (e) {
     return res.status(400).send({
      error: error.message
    });
  }
});

router.post("/user/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).send({ message: "Invalid or expired token" });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.send({ message: "Password reset successful" });
});

router.patch("/user/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(
      currentPassword,
      req.user.password
    );

    if (!isMatch) {
      return res.status(400).send({
        error: "Current password is incorrect"
      });
    }

    req.user.password = newPassword;

    await req.user.save();

    res.send({
      message: "Password updated successfully"
    });

  } catch (e) {
     return res.status(400).send({
      error: error.message
    });
  }
});

export {router}