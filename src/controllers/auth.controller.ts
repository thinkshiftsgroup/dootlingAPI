// import { Request, Response, NextFunction } from 'express';
// import logger from '@utils/logger';
// import prisma from '@config/db';

// export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { username, email, password } = req.body;
//     if (!username || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required.' });
//     }

//     const existingUser = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (existingUser) {
//       return res.status(409).json({ message: 'User with this email already exists.' });
//     }

//     const newUser = await prisma.user.create({
//       data: {
//         username,
//         email,
//         password,
//       },
//     });

//     logger.info(`User registered: ${newUser.username} (${newUser.email})`);
//     res.status(201).json({ message: 'User registered successfully!', user: { id: newUser.id, email: newUser.email } });
//   } catch (error) {
//     next(error);
//   }
// };

// export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required.' });
//     }

//     const user = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials.' });
//     }

//     logger.info(`User logged in: ${email}`);
//     res.status(200).json({ message: 'Logged in successfully!', token: 'sample_jwt_token' });
//   } catch (error) {
//     next(error);
//   }
// };
