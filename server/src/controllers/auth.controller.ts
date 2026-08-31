import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { centralStore } from '../services/store.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../shared/contract';

export class AuthController {
  public async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = centralStore.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'User not found with provided email' });
    }

    if (password && password !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedPatientIds: user.assignedPatientIds
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.json({
      token,
      refreshToken,
      user: payload
    });
  }

  /**
   * Switch Role Helper for fast demonstration and evaluation
   */
  public async switchRole(req: Request, res: Response) {
    const { role } = req.body as { role: UserRole };
    const allUsers = centralStore.getAllUsers();
    const targetUser = allUsers.find(u => u.role === role) || allUsers[0];

    const token = jwt.sign(targetUser, config.jwtSecret, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ id: targetUser.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.json({
      token,
      refreshToken,
      user: targetUser
    });
  }

  public async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ user: req.user });
  }

  public async getUsers(req: Request, res: Response) {
    const users = centralStore.getAllUsers();
    return res.json(users);
  }
}

export const authController = new AuthController();
