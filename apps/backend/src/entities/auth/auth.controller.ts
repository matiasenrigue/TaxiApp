import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../users/user.model';
import { generateAccessToken, generateRefreshToken } from './utils/generateTokens';
import jwt from 'jsonwebtoken';
import { ExpiredDataCleanup } from '../shifts/utils/cleanup/expiredDataCleanup';

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password } = req.body;

    // Check required fields
    if (!email || !username || !password) {
        res.status(400);
        throw new Error('Please provide all fields');
    }

    // Basic validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email) || password.length < 8) {
        res.status(400);
        throw new Error('Invalid email or password');
    }

    // Ensure email is unique
    const exists = await User.findOne({ where: { email } });
    if (exists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    // Create user
    const user = await User.create({ email, username, password });
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { userId: user.id, username: user.username },
    });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
export const signin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
        res.status(400);
        throw new Error('Invalid email or password');
    }

    const user = await User.findOne({ where: { email } });
    if (user && (await user.matchPassword(password))) {
        // 1) create tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // 2) Run cleanup tasks in background (don't block login)
        // This ensures expired shifts and rides are cleaned up regularly for this user only
        // No await here - we don't want to block login
        ExpiredDataCleanup.performLoginCleanup(user.id);

        // 3) set refresh token as secure, HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            path: '/api/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // 4) return access token in body
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: { token: accessToken },
        });
        return;
    }

    res.status(400);
    throw new Error('Invalid email or password');
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (via HttpOnly cookie)
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        res.status(401);
        throw new Error('No refresh token');
    }

    try {
        const { id } = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as { id: string };
        const newAccess = generateAccessToken(id);

        res.json({ success: true, data: { token: newAccess } });
    } catch {
        res.status(403);
        throw new Error('Invalid refresh token');
    }
});


// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/api/auth/refresh',
    });

    res.status(200).json({
        success: true,
        message: 'User logged out successfully',
    });
});
