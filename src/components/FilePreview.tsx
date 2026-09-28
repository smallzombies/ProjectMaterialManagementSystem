import { useEffect, useRef, useState } from 'react'
import { Modal, Descriptions, Tag, Divider, Input, Button, List, Avatar, Empty, Space, message, Grid, Select, Table, Radio, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SendOutlined, UserOutlined, PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { materialsApi } from '../api/services'
import { fmtSize, fmtDate, previewUrl } from '../utils/format'
import { uid } from '../mock/db'
import type { Approval, ExifData, Material } from '../types'

interface Props {
  material: Material | null
  open: boolean
  onClose: () => void
  materials?: Material[]
  onChange?: (m: Material) => void
}

function FilePreview({ material, open, onClose, materials, onChange }: Props) {
  const { db, refresh, update, currentUser, unitConfig, loadProjectData } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [comment, setComment] = useState('')
  const [approval, setApproval] = useState<'合格' | '不合格'>('合格')
  const [tagSearch, setTagSearch] = useState('')
  const [exifOpen, setExifOpen] = useState(false)
  const initialTagsRef = useRef<string[]>([])

  useEffect(() => {
    setComment('')
    setTagSearch('')
    setExifOpen(false)
    setApproval(material?.approval || '合格')
    initialTagsRef.current = material?.tags ? [...material.tags] : []
  }, [material?.id])

  const list = materials && materials.length ? materials : null
  const idx = list ? list.findIndex((m) => m.id === material?.id) : -1
  const hasPrev = list ? idx > 0 : false
  const hasNext = list ? idx >= 0 && idx < list.length - 1 : false
  const goPrev = () => {
    if (hasPrev && list && onChange) onChange(list[idx - 1])
  }
  const goNext = () => {
    if (hasNext && list && onChange) onChange(list[idx + 1])
  }

  useEffect(() => {
    if (!open || !list) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const tag = t.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, list, hasPrev, hasNext, goPrev, goNext])

  if (!material) return null

  const comments = db.comments.filter((c) => c.materialId === material.id)
  const uploader = db.users.find((u) => u.id === material.uploaderId)
  const projectPoints = db.points.filter((p) => p.projectId === material.projectId)
  const tags = db.tags.filter((t) => material.tags.includes(t.id))
  const approvals = db.approvals
    .filter((a) => a.materialId === material.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const tagTree = (pid: string | null): any[] =>
    db.tags
      .filter((t) => t.parentId === pid)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ value: t.id, title: t.name, children: tagTree(t.id) }))

  const flatTagOptions = (() => {
    const opts: { id: string; name: string; path: string }[] = []
    const walk = (pid: string | null, prefix: string) => {
      db.tags
        .filter((t) => t.parentId === pid)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((t) => {
          opts.push({ id: t.id, name: t.name, path: prefix ? `${prefix} / ${t.name}` : t.name })
          walk(t.id, prefix ? `${prefix} / ${t.name}` : t.name)
        })
    }
    walk(null, '')
    return opts
  })()

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

  const handleTagChange = async (tagIds: string[]) => {
    try {
      const oldTags = material.tags || []
      const toAdd = tagIds.filter((t) => !oldTags.includes(t))
      const toRemove = oldTags.filter((t) => !tagIds.includes(t))
      for (const t of toAdd) {
        await materialsApi.addTags(material.id, [t])
      }
      for (const t of toRemove) {
        await materialsApi.removeTag(material.id, t)
      }
      if (material.projectId) await loadProjectData(material.projectId)
      message.success('标签已更新')
    } catch {
      message.error('标签更新失败')
    }
  }

    const createNewTag = async () => {
    const name = tagSearch.trim()
    if (!name) {
      message.warning('请先输入标签名称')
      return
    }
    const existing = db.tags.find((t) => t.name === name)
    if (existing) {
      await handleTagChange([...material.tags, existing.id])
      setTagSearch('')
      return
    }
    try {
      const next = { ...db }
      let uncat = next.tags.find((t) => t.name === '未分类' && t.parentId === null)
      if (!uncat) {
        uncat = { id: uid('t'), parentId: null, name: '未分类' }
        next.tags.push(uncat)
      }
      const newTag = { id: uid('t'), parentId: uncat.id, name }
      next.tags.push(newTag)
      update(next)
      await materialsApi.addTags(material.id, [newTag.id])
      if (material.projectId) await loadProjectData(material.projectId)
      setTagSearch('')
      message.success(`已创建标签"${name}"并归入"未分类"`)
    } catch {
      message.error('标签创建失败')
    }
  }

    const changePoint = async (pointId?: string) => {
    try {
      await materialsApi.batchPoint([material.id], pointId || null)
      if (material.projectId) await loadProjectData(material.projectId)
      message.success('拍摄船舱已更新')
    } catch {
      message.error('船舱更新失败')
    }
  }

  const changeApproval = (val: '合格' | '不合格') => {
    const added = material.tags.filter((t) => !initialTagsRef.current.includes(t))
    const removed = initialTagsRef.current.filter((t) => !material.tags.includes(t))
    const tagChange: Approval['tagChange'] = added.length ? '新增' : removed.length ? '删除' : '无变化'
    const nameOf = (id: string) => db.tags.find((t) => t.id === id)?.name || id
    const changedNames = tagChange === '无变化' ? [] : [...added, ...removed].map(nameOf)

    const next = { ...db }
    const mi = next.materials.findIndex((m) => m.id === material.id)
    next.materials[mi] = { ...material, approval: val }
    next.approvals = [
      ...next.approvals,
      {
        id: uid('a'),
        materialId: material.id,
        userId: currentUser?.id || '',
        result: val,
        tagChange,
        changedNames,
        createdAt: new Date().toISOString().slice(0, 19),
      },
    ]
    update(next)
    refresh()
    setApproval(val)
    message.success(`审批意见已更新为“${val}”`)
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
          <div
            style={{ textAlign: 'center', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src={previewUrl(material.name, material.id)}
              alt={material.name}
              draggable={false}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
            />
          </div>
        )
      case 'video':
        return (
          <video
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: '100%', maxHeight: 420 }}
            src="https://www.w3schools.com/html/mov_bbb.mp4"
          />
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

  const exifRows = (exif: ExifData | undefined): { label: string; value?: string }[] => [
    { label: '相机品牌', value: exif?.cameraBrand },
    { label: '相机型号', value: exif?.cameraModel },
    { label: '光圈', value: exif?.aperture },
    { label: '快门', value: exif?.shutter },
    { label: 'ISO', value: exif?.isoSpeed },
    { label: '焦距', value: exif?.focalLength },
    { label: '白平衡', value: exif?.whiteBalance },
    { label: '色彩编码', value: exif?.colorSpace },
    { label: 'GPS 纬度', value: exif?.gpsLat },
    { label: 'GPS 经度', value: exif?.gpsLng },
    { label: '海拔', value: exif?.gpsAltitude },
  ]

  const approvalColumns: ColumnsType<Approval> = [
    { title: '审批时间', dataIndex: 'createdAt', render: (v: string) => fmtDate(v) },
    { title: '审批人', dataIndex: 'userId', render: (v: string) => db.users.find((u) => u.id === v)?.name || '-' },
    {
      title: '审批结果',
      dataIndex: 'result',
      render: (v: '合格' | '不合格') => <Tag color={v === '合格' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: '标签变化',
      dataIndex: 'tagChange',
      render: (v: Approval['tagChange'], r) =>
        v === '无变化' ? (
          <span className="muted">无变化</span>
        ) : (
          <Space split={<span className="muted">+</span>}>
            <span>{v === '新增' ? '新增' : '删除'}</span>
            <span className="muted">
              {r.changedNames.join('、')}
            </span>
          </Space>
        ),
    },
  ]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      title={material.name}
      destroyOnClose
      style={isMobile ? { top: 8 } : undefined}
    >
      {list && list.length > 1 ? (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
            <Button shape="circle" size="large" icon={<LeftOutlined />} disabled={!hasPrev} onClick={goPrev} />
          </div>
          {renderPreview()}
          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
            <Button shape="circle" size="large" icon={<RightOutlined />} disabled={!hasNext} onClick={goNext} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 8,
              transform: 'translateX(-50%)',
              zIndex: 2,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: 12,
              padding: '2px 10px',
              borderRadius: 10,
            }}
          >
            {idx + 1} / {list.length}
          </div>
        </div>
      ) : (
        renderPreview()
      )}

      <Divider style={{ margin: '16px 0' }} />
      <Descriptions column={2} size="small" bordered labelStyle={{ width: 100 }}>
        <Descriptions.Item label="大小">{fmtSize(material.size)}</Descriptions.Item>
        <Descriptions.Item label="上传人">{uploader?.name || '-'}</Descriptions.Item>
        {unitConfig.showDetailMeta && (
          <Descriptions.Item label="上传时间">{fmtDate(material.uploadTime)}</Descriptions.Item>
        )}
        <Descriptions.Item label="拍摄船舱">
          <Select
            size="small"
            showSearch
            optionFilterProp="label"
            style={{ width: 220 }}
            value={material.pointId}
            placeholder="搜索并选择船舱"
            onChange={changePoint}
            allowClear
            options={projectPoints.map((p) => ({ value: p.id, label: `${p.name}(${p.code})` }))}
          />
        </Descriptions.Item>
        {unitConfig.showDetailMeta && (
          <Descriptions.Item label="拍摄时间">{fmtDate(material.shootingTime)}</Descriptions.Item>
        )}
        <Descriptions.Item label="审批意见">
          <Radio.Group size="small" value={approval} onChange={(e) => changeApproval(e.target.value as '合格' | '不合格')}>
            <Radio.Button value="合格">合格</Radio.Button>
            <Radio.Button value="不合格">不合格</Radio.Button>
          </Radio.Group>
        </Descriptions.Item>
        <Descriptions.Item label="标签">
          <Space wrap>
            {tags.length ? tags.map((t) => <Tag key={t.id} color="blue">{t.name}</Tag>) : <span className="muted">无</span>}
            <Select
              mode="multiple"
              size="small"
              showSearch
              style={{ width: 220 }}
              placeholder="搜索选择 / 创建标签"
              value={material.tags}
              onChange={handleTagChange}
              onSearch={setTagSearch}
              optionFilterProp="label"
              options={flatTagOptions.map((t) => ({ value: t.id, label: t.path }))}
              dropdownRender={(menu) => (
                <div style={{ minWidth: 180 }}>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <Button size="small" block type="link" icon={<PlusOutlined />} onClick={createNewTag}>
                    新建标签“{tagSearch || '未输入名称'}”（归入未分类）
                  </Button>
                </div>
              )}
            />
          </Space>
        </Descriptions.Item>
        {unitConfig.showDetailMeta && (
          <Descriptions.Item label="EXIF">
            {material.type !== 'image' ? (
              <Tag color="default">无信息</Tag>
            ) : material.hasExif ? (
              <a onClick={() => setExifOpen(true)}>
                <Tag color="orange" style={{ cursor: 'pointer', marginRight: 8 }}>含EXIF · 点击查看</Tag>
              </a>
            ) : (
              <Tag color="green">已清除</Tag>
            )}
            {material.hasExif && (
              <Button size="small" type="link" onClick={removeExif} danger>
                一键清除（保留拍摄时间）
              </Button>
            )}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Tabs
        size="small"
        style={{ marginTop: 8 }}
        items={[
          {
            key: 'comments',
            label: `用户批注（${comments.length}）`,
            children: (
              <>
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
              </>
            ),
          },
          ...(unitConfig.showApproval
            ? [
                {
                  key: 'approvals',
                  label: `审批记录（${approvals.length}）`,
                  children: (
                    <Table
                      rowKey="id"
                      size="small"
                      columns={approvalColumns}
                      dataSource={approvals}
                      pagination={false}
                      locale={{ emptyText: <Empty description="暂无审批记录" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />

      <Modal
        open={exifOpen}
        onCancel={() => setExifOpen(false)}
        footer={null}
        width={480}
        title={`EXIF 信息 — ${material.name}`}
        destroyOnClose
      >
        <Descriptions column={2} size="small" bordered>
          {exifRows(material.exif).map((r) => (
            <Descriptions.Item key={r.label} label={r.label}>
              {r.value || '-'}
            </Descriptions.Item>
          ))}
        </Descriptions>
        <div className="muted" style={{ marginTop: 8 }}>
          拍摄时间：{fmtDate(material.shootingTime)} · 照片中含 GPS 与设备信息
        </div>
      </Modal>
    </Modal>
  )
}

export default FilePreview