const { validationResult } = require('express-validator');
const db = require('../db/firestore');
const User = require('../models/user');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { generateToken } = require('../utils/jwtUtils');
const { v4: uuidv4 } = require('uuid');  

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            return res.status(400).json({
                status: "fail",
                message: "Account already exists"
            });
        }

        const userId = uuidv4(); 
        const hashedPassword = await hashPassword(password);
        const user = new User(email, hashedPassword, name);
        user.userId = userId;  

        await userRef.set(Object.assign({}, user));

        return res.status(201).json({
            status: "successful",
            message: "User registered successfully",
            userId
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
};

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists || !(await comparePassword(password, userDoc.data().password))) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid email or password"
            });
        }

        const token = generateToken({ email });

        await userRef.update({
            "token.auth": token,
            "updatedAt": new Date()
        });

        return res.status(200).json({
            status: "successful",
            message: "User logged in successfully",
            token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
};

const logout = async (req, res) => {
    const { email } = req.user;

    try {
        const userRef = db.collection('users').doc(email);
        await userRef.update({
            "token.auth": null,
            "updatedAt": new Date()
        });

        return res.status(201).json({
            status: "successful",
            message: "User logout successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
};

const deleteAccount = async (req, res) => {
    const { email } = req.user;

    try {
        const userRef = db.collection('users').doc(email);
        await userRef.delete();

        return res.status(201).json({
            status: "successful",
            message: "Delete account successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
};

const resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.user; 
    const { password } = req.body; 

    try {
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(400).json({
                status: "fail",
                message: "User not found"
            });
        }

        const hashedPassword = await hashPassword(password);

        await userRef.update({
            password: hashedPassword,
            updatedAt: new Date()
        });

        return res.status(201).json({
            status: "successful",
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    deleteAccount,
    resetPassword
};