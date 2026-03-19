require('dotenv').config()
const express = require('express')
const app = express()
const users = require('./models/user.Model')
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const cookies = require('cookie-parser')
const analys= require('./models/analys.Model')
const validator = require('validator');
const crypto = require('crypto');
const mailer = require('./mailer');

app.use(cookies())
app.use(cors({
    origin: "http://localhost:5173", // your React app
    credentials: true
}));

app.use(express.json())
app.use(express.urlencoded({extended: true}))


app.get('/',(req,res)=>{
    console.log('running')
    res.send("hello")
})


app.post('/create', async (req, res) => {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password)
        return res.status(400).json({ message: "Missing fields" });

    if (!validator.isEmail(email))
        return res.status(400).json({ message: "Invalid email format" });

    const existing = await users.findOne({ email });
    if (existing)
        return res.status(409).json({ message: "Email already in use" });

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const verifyToken = crypto.randomBytes(32).toString('hex');

        const user = await users.create({
            userName,
            email,
            password: hash,
            verifyToken,
            isVerified: false
        });
        const baseURL = process.env.BASE_URL || "http://localhost:4000";
        // Send verification email
        await mailer.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email',
            html: `
                <div style="font-family: Arial; text-align: center;">
                    <h2>Verify Your Email</h2>
                    <p>Click the button below to verify your account:</p>
                    <a href="${baseURL}/verify/${verifyToken}" 
                    style="padding:10px 20px; background:#4CAF50; color:white; text-decoration:none; border-radius:5px;">
                    Verify Email
                    </a>
                    <p>If you didn’t request this, ignore this email.</p>
                </div>
            `
        });

        res.json({ success: true, message: "Check your email to verify your account" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
});

app.get('/verify/:token', async (req, res) => {
    const user = await users.findOne({ verifyToken: req.params.token });

    if (!user)
        return res.status(400).json({ message: "Invalid or expired token" });

    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified! You can now log in." });
});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Missing fields"
        });
    }

    try {
        const findUser = await users.findOne({ email });

        if (!findUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (!findUser.isVerified) {
            return res.status(403).json({ message: "Please verify your email first" });
        }
        const isMatch = await bcrypt.compare(password, findUser.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            { id: findUser._id, username : findUser.userName ,email: findUser.email},
            "secret",{expiresIn : '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });
        
        res.status(200).json({
            success: true,
            message: "Login successful"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});
app.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ success: true, message: "Logged out" });
});

app.get('/me', async (req,res)=>{
    const token = req.cookies.token;    
    if (!token) return res.status(401).json({
    success: false,
    message: "Unauthorized"
});

    try {
        const decoded = jwt.verify(token, "secret");

        res.json({
            id: decoded.id,
            email: decoded.email,
            username : decoded.username,
        });
    } catch {
        return res.status(401).json({
                success: false,
                message:'server error'
            });
    }
})

app.post('/friend', async (req,res)=>{
    const {frd,_id} = req.body;
    if(!frd || !_id) 
    {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }
    try {
        const user = await users.findOne({_id:id})
        if(!user) return res.status(200).json({
                success: false,
                message: "user not found"
            });;
        const partner = await users.findOne({userName:frd})
        if(!partner) return res.status(401).json({ message: "No User found" });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
})

app.post('/analys', async (req, res) => {
    const { 
        basicStats, 
        user: id, 
        progressScore, 
        dailyTreads, 
        weeklyTreads, 
        improveTread,
    } = req.body;   

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "User ID missing"
        });
    }

    try {
        const user = await users.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
    const analysM = await analys.findOneAndUpdate(
        { userId : id }, 
        { basicStats, progressScore, dailyTreads, weeklyTreads, improveTread, userId: id, createdAt: new Date() },
        { upsert: true, returnDocument: 'after' }
    );

        if(!user.analys) user.analys = [];
        await users.findByIdAndUpdate(id, {
            $addToSet: { analys: analysM._id }
        });
        res.status(200).json({
            success: true,
            message: "Analytics updated successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});
app.post('/forgot-password', async (req, res) => {
    const { email  } = req.body;

    const user = await users.findOne({ email:email });

    // Always return the same message — don't reveal if email exists or not
    if (!user) {
        return res.json({ message: "If that email exists, a reset link has been sent" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();
    const baseURL = process.env.BASE_URL || "http://localhost:4000";

    await mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset your password',
        html: `<p>Click to reset your password (link expires in 1 hour):</p>
            <a href="${baseURL}/reset-password/${resetToken}">Reset Password</a>`
    });

    res.json({ message: "If that email exists, a reset link has been sent" });
});

// Step 2 — Submit new password
app.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;

    const user = await users.findOne({
        resetToken: req.params.token,
        resetTokenExpiry: { $gt: Date.now() }   // token must not be expired
    });

    if (!user)
        return res.status(400).json({ message: "Invalid or expired reset link" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. You can now log in." });
});
app.listen(4000)