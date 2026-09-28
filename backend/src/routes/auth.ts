import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { usersRepo } from '../repositories/users.js'
import { resolveAuthUser, signToken, authMiddleware } from '../auth.js'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { login, password } = req.body || {}
  if (!login || !password) return res.status(400).json({ message: '请输入账号和密码' })
  const user = await usersRepo.findByLogin(login)
  if (!user) return res.status(401).json({ message: '账号不存在' })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ message: '密码错误' })
  if (user.status !== '启用') return res.status(401).json({ message: '账号已停用' })
  const au = await resolveAuthUser(user.id)
  const token = signToken(user.id)
  res.json({ token, user: au })
})

authRouter.get('/me', authMiddleware, async (req, res) => {
  const au = (req as any).authUser
  res.json({ user: au })
})
