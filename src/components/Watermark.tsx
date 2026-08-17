import { useEffect, useRef } from 'react'
import { useApp } from '../store/AppContext'

// 使用 Shadow DOM 隔离样式，避免被页面/控制台全局样式覆盖
function Watermark() {
  const { currentUser, loginTime } = useApp()
  const hostRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<ShadowRoot | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: 'closed' })
    }
    const root = shadowRef.current
    const style = document.createElement('style')
    style.textContent = `
      .wm-layer {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        pointer-events: none;
        overflow: hidden;
      }
      .wm-body {
        position: absolute;
        top: 0; left: 0; right: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 80px 120px;
        padding: 60px 40px;
        transform: rotate(-18deg);
        transform-origin: center center;
      }
      .wm-item {
        color: rgba(0, 0, 0, 0.12);
        font-size: 15px;
        line-height: 1.6;
        white-space: nowrap;
        user-select: none;
        font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      }
    `
    root.appendChild(style)

    const text = `${currentUser?.name || '-'} · 登录时间 ${loginTime ? new Date(loginTime).toLocaleString('zh-CN') : '-'}`

    const render = () => {
      root.querySelector('.wm-body')?.remove()
      const body = document.createElement('div')
      body.className = 'wm-body'
      const wmHeight = 90
      const wmWidth = 360
      const cols = Math.ceil((window.innerWidth + 400) / (wmWidth + 120))
      const rows = Math.ceil((window.innerHeight + 200) / (wmHeight + 80))
      for (let i = 0; i < cols * rows; i++) {
        const span = document.createElement('span')
        span.className = 'wm-item'
        span.textContent = text
        body.appendChild(span)
      }
      root.appendChild(body)
    }

    render()
    window.addEventListener('resize', render)

    // 防止开发工具删除水印：每次动画帧检测是否存在，被移除则立即重建
    let raf = 0
    const watch = () => {
      if (!root.querySelector('.wm-body')) render()
      raf = requestAnimationFrame(watch)
    }
    raf = requestAnimationFrame(watch)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', render)
    }
  }, [currentUser?.id, loginTime])

  return <div ref={hostRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />
}

export default Watermark