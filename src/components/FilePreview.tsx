import { useEffect, useState } from 'react'
import { Modal, Descriptions, Tag, Divider, Input, Button, List, Avatar, Empty, Space, message, Popover, TreeSelect, Grid } from 'antd'
import { SendOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { fmtSize, fmtDate, previewUrl } from '../utils/format'
import { uid } from '../mock/db'
import type { Material } from '../types'

interface Props {
  material: Material | null
  open: boolean
  onClose: () => void
}

function FilePreview({ material, open, onClose }: Props) {
  const { db, refresh, update, currentUser } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [comment, setComment] = useState('')

  useEffect(() => {
    setComment('')
  }, [material?.id])

  if (!material) return null

  const comments = db.comments.filter((c) => c.materialId === material.id)
  const uploader = db.users.find((u) => u.id === material.uploaderId)
  const point = db.points.find((p) => p.id === material.pointId)
  const tags = db.tags.filter((t) => material.tags.includes(t.id))
  const versions = [...material.versions].sort((a, b) => b.version - a.version)

  const tagTree = (pid: string | null): any[] =>
    db.tags
      .filter((t) => t.parentId === pid)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ value: t.id, title: t.name, children: tagTree(t.id) }))

  const addComment = () => {
    if (!comment.trim()) return
    const mentions = Array.from(comment.matchAll(/@(\S+)/g)).map((m) => m[1])
    const mentionIds: string[] = []
    for (const name of mentions) {
      const u = db.users.find((x) => x.name.includes(name.replace(/@/g, '')))
      if (u) mentionIds.push(u.id)
    }
    const next = { ...db }
    next.comments.push({
      id: uid('c'),
      materialId: material.id,
      authorId: currentUser?.id || '',
      content: comment,
      createdAt: new Date().toISOString().slice(0, 19),
      mentions: mentionIds,
    })
    const mi = next.materials.findIndex((m) => m.id === material.id)
    next.materials[mi] = { ...material, commentCount: comments.length + 1 }
    update(next)
    refresh()
    setComment('')
    message.success('批注已提交')
  }

  const handleTagChange = (tagIds: string[]) => {
    const next = { ...db }
    const mi = next.materials.findIndex((m) => m.id === material.id)
    if (mi >= 0) next.materials[mi] = { ...material, tags: tagIds }
    next.materialTags = [
      ...next.materialTags.filter((t) => t.materialId !== material.id),
      ...tagIds.map((t) => ({ materialId: material.id, tagId: t, userId: currentUser?.id || '', time: new Date().toISOString().slice(0, 19) })),
    ]
    update(next)
    refresh()
    message.success('标签已更新')
  }

  const removeExif = () => {
    const next = { ...db }
    const mi = next.materials.findIndex((m) => m.id === material.id)
    next.materials[mi] = { ...material, hasExif: false }
    next.logs.unshift({
      id: uid('l'),
      materialId: material.id,
      materialName: material.name,
      projectId: material.projectId,
      userId: currentUser?.id || '',
      actionType: 'EXIF清除',
      detail: '清除GPS与设备信息，保留拍摄时间',
      ip: '10.0.0.88',
      createdAt: new Date().toISOString().slice(0, 19),
    })
    update(next)
    refresh()
    message.success('EXIF 已清除（保留拍摄时间）')
  }

  const renderPreview = () => {
    switch (material.type) {
      case 'image':
        return (
          <div style={{ textAlign: 'center', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img
              src={previewUrl(material.name, material.id)}
              alt={material.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        )
      case 'video':
        return (
          <video controls style={{ width: '100%', maxHeight: 420 }} src="https://www.w3schools.com/html/mov_bbb.mp4" />
        )
      case 'pdf':
        return (
          <div style={{ textAlign: 'center', padding: 40, background: '#fafafa', borderRadius: 8 }}>
            <Empty description={`PDF 文档预览（${material.name}）`} />
            <Button type="primary" style={{ marginTop: 8 }} onClick={() => message.info('下载演示：mock 环境不提供真实文件')}>
              下载文档
            </Button>
          </div>
        )
      case 'cad':
        return (
          <div style={{ textAlign: 'center', padding: 40, background: '#fafafa', borderRadius: 8 }}>
            <Empty description="CAD 图纸预览（集成专业查看器）" />
            <div className="muted">支持缩放 / 图层切换 / 测量（按选型实现）</div>
          </div>
        )
      case 'model':
      case 'pointcloud':
        return (
          <div style={{ textAlign: 'center', padding: 40, background: '#0f1c2e', borderRadius: 8, color: '#fff' }}>
            <div style={{ fontSize: 40 }}>🗺</div>
            <div style={{ marginTop: 8 }}>三维模型 / 点云浏览器（LOD 分级加载）</div>
            <div className="muted" style={{ color: '#9fb3c8', marginTop: 4 }}>
              旋转 / 缩放 / 平移；PC 端查看，不做测量
            </div>
          </div>
        )
      default:
        return (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Empty description="该格式文件暂不支持预览，请下载查看" />
            <Button onClick={() => message.info('下载演示')} style={{ marginTop: 8 }}>
              下载文件
            </Button>
          </div>
        )
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      title={material.name}
      destroyOnClose
      style={isMobile ? { top: 8 } : undefined}
    >
      {renderPreview()}

      <Divider style={{ margin: '16px 0' }} />
      <Descriptions column={isMobile ? 1 : 2} size="small" bordered>
        <Descriptions.Item label="大小" span={isMobile ? 2 : undefined}>{fmtSize(material.size)}</Descriptions.Item>
        <Descriptions.Item label="上传人" span={isMobile ? 2 : undefined}>{uploader?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="上传时间" span={isMobile ? 2 : undefined}>{fmtDate(material.uploadTime)}</Descriptions.Item>
        <Descriptions.Item label="拍摄点位" span={isMobile ? 2 : undefined}>{point ? `${point.name}(${point.code})` : '-'}</Descriptions.Item>
        <Descriptions.Item label="拍摄时间" span={isMobile ? 2 : undefined}>{fmtDate(material.shootingTime)}</Descriptions.Item>
        <Descriptions.Item label="标签" span={isMobile ? 2 : undefined}>
          <Space wrap>
            {tags.length ? tags.map((t) => <Tag key={t.id} color="blue">{t.name}</Tag>) : <span className="muted">无</span>}
            <TreeSelect
              size="small"
              style={{ minWidth: isMobile ? 160 : 200 }}
              placeholder="打标签"
              treeDefaultExpandAll
              value={material.tags}
              onChange={handleTagChange}
              treeData={tagTree(null)}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="EXIF" span={isMobile ? 2 : undefined}>
          <Tag color={material.hasExif ? 'orange' : 'green'}>{material.hasExif ? '含EXIF' : '已清除'}</Tag>
          {material.hasExif && (
            <Button size="small" type="link" onClick={removeExif} danger>
              一键清除（保留拍摄时间）
            </Button>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="历史版本" span={isMobile ? 2 : undefined}>
          <Popover
            trigger="click"
            content={
              <List
                size="small"
                dataSource={versions}
                renderItem={(v) => (
                  <List.Item>
                    <Space>
                      <HistoryOutlined />
                      <span>v{v.version}</span>
                      <span className="muted">{fmtDate(v.createTime)}</span>
                      <Button size="small" type="link" onClick={() => message.info('下载演示')}>
                        下载
                      </Button>
                    </Space>
                  </List.Item>
                )}
              />
            }
          >
            <Button size="small" icon={<HistoryOutlined />}>
              v{material.versions.length} 个版本
            </Button>
          </Popover>
        </Descriptions.Item>
      </Descriptions>

      <Divider>{'用户批注（'}{comments.length}{'）'}</Divider>

      <List
        size="small"
        dataSource={comments}
        locale={{ emptyText: <Empty description="暂无批注" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(c) => {
          const author = db.users.find((u) => u.id === c.authorId)
          return (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }} size="small" />}
                title={
                  <Space>
                    <b>{author?.name}</b>
                    <span className="muted">{c.createdAt}</span>
                  </Space>
                }
                description={c.content}
              />
            </List.Item>
          )
        }}
      />
      <Space.Compact style={{ width: '100%', marginTop: 8 }}>
        <Input
          placeholder="输入批注，支持 @用户名 提醒"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onPressEnter={addComment}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={addComment}>
          提交
        </Button>
      </Space.Compact>
    </Modal>
  )
}

export default FilePreview