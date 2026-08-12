import { Card, Table, Button, Space, Tag, message, Popconfirm, Grid, List } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StopOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApp } from '../store/AppContext'
import type { ShareLink } from '../types'

function Shares() {
  const { db, refresh, update, currentUser, isAdmin } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const visible = db.shares.filter((s) => isAdmin || s.createBy === currentUser?.id)

  const revoke = (s: ShareLink) => {
    const next = { ...db }
    const i = next.shares.findIndex((x) => x.id === s.id)
    next.shares[i] = { ...s, status: '已撤回' }
    update(next)
    refresh()
    message.success('链接已撤回')
  }

  const shareSummary = (s: ShareLink) => {
    const folders = s.folderIds
      .map((fid) => db.folders.find((f) => f.id === fid)?.name)
      .filter(Boolean)
    return (
      <Space direction="vertical" size={2}>
        {folders.length > 0 && (
          <Space wrap size={0}>
            {folders.map((f) => (
              <Tag key={f} color="gold" style={{ margin: 0 }}>📁 {f}</Tag>
            ))}
          </Space>
        )}
        <span className="muted">
          {folders.length ? `含文件夹中 ${s.materialIds.length} 个素材` : `${s.materialIds.length} 个素材`}
        </span>
      </Space>
    )
  }

  const columns: ColumnsType<ShareLink> = [
    {
      title: '链接',
      dataIndex: 'url',
      render: (t: string) => <a onClick={() => navigator.clipboard?.writeText(t).catch(() => {}) || message.info('演示链接：' + t)}>{t}</a>,
    },
    {
      title: '分享内容',
      dataIndex: 'folderIds',
      render: (_, r) => shareSummary(r),
    },
    {
      title: '访问方式',
      dataIndex: 'accessMode',
      render: (v: string, r) => (
        <Space>
          <Tag color={v === '免登录' ? 'gold' : 'blue'}>{v}</Tag>
          <Tag color={r.downloadAllowed ? 'green' : 'default'}>{r.downloadAllowed ? '可下载' : '仅预览'}</Tag>
        </Space>
      ),
    },
    {
      title: '有效期',
      dataIndex: 'expireAt',
      render: (v: string) => (dayjs(v).isBefore(dayjs()) ? <Tag color="red">已过期</Tag> : v),
    },
    { title: '创建人', dataIndex: 'createBy', render: (v: string) => db.users.find((u) => u.id === v)?.name },
    { title: '创建时间', dataIndex: 'createTime' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={s === '有效' ? 'processing' : 'default'}>{s}</Tag>,
    },
    {
      title: '操作',
      width: 90,
      render: (_, r) =>
        r.status === '有效' ? (
          <Popconfirm title="撤回后链接立即失效?" onConfirm={() => revoke(r)}>
            <Button size="small" type="link" danger icon={<StopOutlined />}>
              撤回
            </Button>
          </Popconfirm>
        ) : (
          <span className="muted">已失效</span>
        ),
    },
  ]

  return (
    <Card title="外链分享">
      <div className="muted" style={{ marginBottom: 12 }}>
        外链在“项目管理”中选择文件夹或文件后创建；这里统一管理（查看、撤回）。
      </div>
      {isMobile ? (
        <List
          dataSource={visible}
          rowKey="id"
          locale={{ emptyText: '暂无外链' }}
          renderItem={(r) => (
            <Card size="small" style={{ marginBottom: 10 }} styles={{ body: { padding: 12 } }}>
              <div className="ellipsis" style={{ color: '#1677ff', marginBottom: 6 }}>
                <a onClick={() => navigator.clipboard?.writeText(r.url).catch(() => {}) || message.info('演示链接：' + r.url)}>{r.url}</a>
              </div>
              {shareSummary(r)}
              <div style={{ marginTop: 8 }}>
                <Space wrap size={[0, 4]}>
                  <Tag color={r.accessMode === '免登录' ? 'gold' : 'blue'}>{r.accessMode}</Tag>
                  <Tag color={r.downloadAllowed ? 'green' : 'default'}>{r.downloadAllowed ? '可下载' : '仅预览'}</Tag>
                  <Tag color={dayjs(r.expireAt).isBefore(dayjs()) ? 'red' : 'default'}>
                    {dayjs(r.expireAt).isBefore(dayjs()) ? '已过期' : r.expireAt}
                  </Tag>
                  <Tag color={r.status === '有效' ? 'processing' : 'default'}>{r.status}</Tag>
                </Space>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                创建人：{db.users.find((u) => u.id === r.createBy)?.name} · {r.createTime}
              </div>
              {r.status === '有效' && (
                <Popconfirm title="撤回后链接立即失效?" onConfirm={() => revoke(r)}>
                  <Button size="small" danger icon={<StopOutlined />} style={{ marginTop: 8 }}>
                    撤回
                  </Button>
                </Popconfirm>
              )}
            </Card>
          )}
        />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={visible} pagination={false} />
      )}
    </Card>
  )
}

export default Shares