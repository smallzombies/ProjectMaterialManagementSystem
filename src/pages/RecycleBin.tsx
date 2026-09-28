import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Modal, message, Grid, List, Checkbox } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UndoOutlined, ClearOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { trashApi, materialsApi } from '../api/services'
import { fmtSize, fmtDate, TYPE_LABEL } from '../utils/format'
import { uid } from '../mock/db'
import type { Material } from '../types'

interface TrashItem {
  id: string
  projectId: string
  name: string
  type?: string | null
  size?: number
  deletedBy?: string | null
  deletedAt?: string
  data?: any
}

function RecycleBin() {
  const { db, refresh, update, isAdmin, currentUser, can } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [deleted, setDeleted] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [clearConfirm, setClearConfirm] = useState(false)

  const canRecover = isAdmin || can('material.delete')

  const load = () => {
    setLoading(true)
    trashApi
      .list()
      .then((list) => setDeleted(list))
      .catch((e) => message.error(e?.message || '加载回收站失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const log = (detail: string) => {
    const next = { ...db }
    next.logs = [
      {
        id: uid('l'),
        projectId: '',
        userId: currentUser?.id || '',
        actionType: '回收站',
        detail,
        ip: '10.0.0.88',
        createdAt: new Date().toISOString().slice(0, 19),
      },
      ...next.logs,
    ]
    update(next)
    refresh()
  }

  const restore = async (ids: string[]) => {
    try {
      const items = await Promise.all(ids.map((id) => trashApi.restore(id)))
      const restored = items.filter(Boolean)
      // 将恢复的素材重新写入后端 materials 表
      for (const m of restored) {
        await materialsApi.create({ ...m, status: '正常', deletedAt: undefined, deletedBy: undefined })
      }
      await trashApi.purge(ids)
      setDeleted((d) => d.filter((x) => !ids.includes(x.id)))
      setSelected([])
      log(`从回收站恢复 ${ids.length} 个文件`)
      message.success('已恢复')
    } catch (e: any) {
      message.error(e?.message || '恢复失败')
    }
  }

  const clear = async () => {
    const ids = selected.length ? selected : deleted.map((m) => m.id)
    try {
      await trashApi.purge(ids)
      const next = { ...db }
      next.materials = next.materials.filter((m) => !ids.includes(m.id))
      update(next)
      refresh()
      setDeleted((d) => d.filter((x) => !ids.includes(x.id)))
      setSelected([])
      setClearConfirm(false)
      log(`彻底删除 ${ids.length} 个文件`)
      message.success('已彻底删除')
    } catch (e: any) {
      message.error(e?.message || '删除失败')
    }
  }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const columns: ColumnsType<TrashItem> = [
    { title: '文件名', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 90, render: (t: string) => <Tag>{t ? TYPE_LABEL[t as Material['type']] : '-'}</Tag> },
    { title: '大小', dataIndex: 'size', width: 110, render: (s: number) => fmtSize(s || 0) },
    { title: '删除人', dataIndex: 'deletedBy', width: 100, render: (v?: string) => db.users.find((u) => u.id === v)?.name || '-' },
    { title: '删除时间', dataIndex: 'deletedAt', width: 150, render: (v?: string) => fmtDate(v) },
    {
      title: '操作',
      width: 120,
      render: (_, r) => (
        <Space>
          {canRecover && (
            <Button size="small" type="link" icon={<UndoOutlined />} onClick={() => restore([r.id])}>
              恢复
            </Button>
          )}
          <Button size="small" type="link" danger onClick={() => { setSelected([r.id]); setClearConfirm(true) }}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title={<Space><ExclamationCircleOutlined /> 回收站</Space>}
      extra={
        !isMobile && (
          <Space>
            {deleted.length > 0 && (
              <>
                <Button size="small" onClick={() => restore(selected)} disabled={!selected.length} icon={<UndoOutlined />}>
                  恢复选中
                </Button>
                {isAdmin && (
                  <Button size="small" danger icon={<ClearOutlined />} onClick={() => setClearConfirm(true)} disabled={!deleted.length}>
                    清空回收站
                  </Button>
                )}
              </>
            )}
          </Space>
        )
      }
    >
      {isMobile && (
        <div style={{ marginBottom: 12 }}>
          <Space wrap>
            <Button size="small" onClick={() => restore(selected)} disabled={!selected.length} icon={<UndoOutlined />}>
              恢复选中（{selected.length}）
            </Button>
            {isAdmin && (
              <Button size="small" danger icon={<ClearOutlined />} onClick={() => { setSelected([]); setClearConfirm(true) }} disabled={!deleted.length}>
                清空回收站
              </Button>
            )}
          </Space>
        </div>
      )}

      {isMobile ? (
        <List
          dataSource={deleted}
          rowKey="id"
          locale={{ emptyText: '回收站为空' }}
          renderItem={(r) => (
            <Card
              size="small"
              style={{ marginBottom: 10 }}
              styles={{ body: { padding: 12 } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Checkbox checked={selected.includes(r.id)} onChange={() => toggle(r.id)} style={{ marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span className="ellipsis" style={{ fontWeight: 500 }}>{r.name}</span>
                    <Tag style={{ flexShrink: 0 }}>{r.type ? TYPE_LABEL[r.type as Material['type']] : '-'}</Tag>
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {fmtSize(r.size || 0)} · 删除人：{db.users.find((u) => u.id === r.deletedBy)?.name || '-'}
                    <br />
                    删除时间：{fmtDate(r.deletedAt)}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      {canRecover && (
                        <Button size="small" icon={<UndoOutlined />} onClick={() => restore([r.id])}>
                          恢复
                        </Button>
                      )}
                      <Button size="small" danger onClick={() => { setSelected([r.id]); setClearConfirm(true) }}>
                        彻底删除
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            </Card>
          )}
        />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={deleted}
          pagination={false}
          rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
          locale={{ emptyText: '回收站为空' }}
        />
      )}

      <Modal
        open={clearConfirm}
        title={selected.length ? '确认彻底删除' : '清空回收站'}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        onOk={clear}
        onCancel={() => setClearConfirm(false)}
        destroyOnClose
      >
        {selected.length
          ? `将彻底删除选中的 ${selected.length} 个文件，此操作不可恢复。是否继续？`
          : `将彻底删除回收站内全部 ${deleted.length} 个文件（不可恢复）。是否继续？`}
      </Modal>
    </Card>
  )
}

export default RecycleBin
