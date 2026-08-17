import { useState } from 'react'
import {
  Card,
  Input,
  Tree,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Empty,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { uid } from '../mock/db'
import type { Tag as TagType } from '../types'

function Tags() {
  const { db, refresh, update, can, currentUser, isAdmin } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState<TagType | null>(null)
  const [parentForCreate, setParentForCreate] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  const myProjectIds = isAdmin ? db.projects.map((p) => p.id) : currentUser?.projectIds || []

  const tagUsage = (tagId: string) =>
    db.materials.filter((m) => m.tags.includes(tagId) && myProjectIds.includes(m.projectId)).length

  const visibleTree = db.tags.filter(
    (t) => !keyword || t.name.includes(keyword) || (t.parentId && db.tags.find((p) => p.id === t.parentId)?.name.includes(keyword)),
  )

  const treeData = (pid: string | null): any[] => {
    const children = visibleTree
      .filter((t) => t.parentId === pid)
      .sort((a, b) => a.name.localeCompare(b.name))
    return children.map((t) => ({
      key: t.id,
      title: (
        <Space size={4}>
          <span>{t.name}</span>
          <span className="muted">（{tagUsage(t.id)}）</span>
          {can('material.tag') && (
            <Space size={0}>
              <Button size="small" type="text" icon={<PlusOutlined />} title="添加子标签" onClick={(e) => { e.stopPropagation(); setEditing(null); setParentForCreate(t.id); form.resetFields(); setModalOpen(true) }} />
              <Button size="small" type="text" icon={<EditOutlined />} title="编辑" onClick={(e) => { e.stopPropagation(); setEditing(t); setParentForCreate(null); form.setFieldsValue(t); setModalOpen(true) }} />
              <Button size="small" type="text" danger icon={<DeleteOutlined />} title="删除" onClick={(e) => { e.stopPropagation(); deleteTag(t) }} />
            </Space>
          )}
        </Space>
      ),
      children: treeData(t.id),
    }))
  }

  const submit = () => {
    form.validateFields().then((v) => {
      const next = { ...db }
      if (editing) {
        const i = next.tags.findIndex((t) => t.id === editing.id)
        next.tags[i] = { ...editing, name: v.name, parentId: v.parentId ?? null }
        message.success('标签已更新')
      } else {
        next.tags.push({ id: uid('t'), parentId: (v.parentId ?? parentForCreate) || null, name: v.name })
        message.success('标签已创建')
      }
      update(next)
      refresh()
      setModalOpen(false)
      setEditing(null)
      setParentForCreate(null)
    })
  }

  const deleteTag = (t: TagType) => {
    const next = { ...db }
    next.tags = next.tags.filter((x) => x.id !== t.id)
    const allIds = new Set<string>([t.id])
    const walk = (pid: string) => {
      db.tags.filter((x) => x.parentId === pid).forEach((x) => {
        allIds.add(x.id)
        walk(x.id)
      })
    }
    walk(t.id)
    next.materials = next.materials.map((m) => ({ ...m, tags: m.tags.filter((x) => !allIds.has(x)) }))
    next.materialTags = next.materialTags.filter((x) => !allIds.has(x.tagId))
    update(next)
    refresh()
    message.success('标签已删除')
  }

  const onDrop: React.ComponentProps<typeof Tree>['onDrop'] = (info) => {
    const dragKey = String(info.dragNode.key)
    const dropKey = String(info.node.key)
    const drag = db.tags.find((t) => t.id === dragKey)
    const target = db.tags.find((t) => t.id === dropKey)
    if (!drag || !target) return

    const newParentId = info.dropToGap ? target.parentId : dropKey

    if (newParentId === drag.id) {
      message.warning('不能将标签移动到自身内部')
      return
    }
    let cur: string | null = newParentId
    while (cur) {
      if (cur === drag.id) {
        message.warning('不能将标签移动到其子级下')
        return
      }
      cur = db.tags.find((t) => t.id === cur)?.parentId ?? null
    }
    if (drag.parentId === newParentId) return

    const next = { ...db }
    const i = next.tags.findIndex((t) => t.id === drag.id)
    next.tags[i] = { ...drag, parentId: newParentId }
    update(next)
    refresh()
    message.success('标签已移动')
  }

  const hasData = db.tags.length > 0

  return (
    <Card title="标签管理">
      <div className="toolbar">
        <Space>
          <Input.Search placeholder="搜索标签" style={{ width: 220 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} onSearch={setKeyword} allowClear />
          {can('material.tag') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setParentForCreate(null); form.resetFields(); setModalOpen(true) }}>
              创建顶级标签
            </Button>
          )}
        </Space>
      </div>
      <div className="muted" style={{ marginBottom: 8 }}>
        {can('material.tag') ? '可直接拖拽标签到其他分类下调整层级' : '预览模式：仅可查看标签层级'}
      </div>
      <div style={{ maxHeight: 480, overflow: 'auto', background: '#fafafa', borderRadius: 8, padding: 12 }}>
        {hasData ? (
          <Tree treeData={treeData(null)} defaultExpandAll blockNode draggable={can('material.tag')} onDrop={onDrop} />
        ) : (
          <Empty description="暂无标签，点击右上角“创建顶级标签”" />
        )}
      </div>

      <Modal
        title={editing ? '编辑标签' : parentForCreate ? '添加子标签' : '创建顶级标签'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => { setModalOpen(false); setEditing(null); setParentForCreate(null) }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editing && !parentForCreate && (
            <Form.Item name="parentId" label="父级标签（可选）">
              <Select allowClear placeholder="留空则为顶级标签" options={db.tags.map((t) => ({ value: t.id, label: t.name }))} />
            </Form.Item>
          )}
          {parentForCreate && (
            <div className="muted" style={{ marginBottom: 8 }}>
              将创建在：{db.tags.find((t) => t.id === parentForCreate)?.name}
            </div>
          )}
          <Form.Item name="name" label="标签名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：桩基" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Tags