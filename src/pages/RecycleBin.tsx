import { useState } from 'react'
import { Card, Table, Button, Space, Tag, Modal, message, Grid, List, Checkbox } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UndoOutlined, ClearOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useApp } from '../store/AppContext'
import { fmtSize, fmtDate, TYPE_LABEL } from '../utils/format'
import { uid } from '../mock/db'
import type { Material } from '../types'

function RecycleBin() {
  const { db, refresh, update, isAdmin, currentUser, can } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selected, setSelected] = useState<string[]>([])
  const [clearConfirm, setClearConfirm] = useState(false)

  const deleted = db.materials.filter((m) => m.status === '回收站')
  const canRecover = isAdmin || can('material.delete')

  const restore = (ids: string[]) => {
    const next = { ...db }
    const now = new Date().toISOString().slice(0, 19)
    next.materials = next.materials.map((m) => (ids.includes(m.id) ? { ...m, status: '正常', deletedAt: undefined, deletedBy: undefined } : m))
    next.logs.unshift({
      id: uid('l'),
      projectId: '',
      userId: currentUser?.id || '',
      actionType: '恢复',
      detail: `从回收站恢复 ${ids.length} 个文件`,
      ip: '10.0.0.88',
      createdAt: now,
    })
    update(next)
    refresh()
    setSelected([])
    message.success('已恢复')
  }

  const clear = () => {
    const ids = selected.length ? selected : deleted.map((m) => m.id)
    const next = { ...db }
    next.materials = next.materials.filter((m) => !ids.includes(m.id))
    update(next)
    refresh()
    setSelected([])
    message.success('已彻底删除')
  }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const columns: ColumnsType<Material> = [
    { title: '文件名', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 90, render: (t: string) => <Tag>{TYPE_LABEL[t as Material['type']]}</Tag> },
    { title: '大小', dataIndex: 'size', width: 110, render: (s: number) => fmtSize(s) },
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
                    <Tag style={{ flexShrink: 0 }}>{TYPE_LABEL[r.type]}</Tag>
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {fmtSize(r.size)} · 删除人：{db.users.find((u) => u.id === r.deletedBy)?.name || '-'}
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