import { useMemo, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  message,
  Space,
  Tag,
} from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApp } from '../store/AppContext'
import { uid } from '../mock/db'
import { fmtSize } from '../utils/format'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  presetFolders: string[]
  presetMaterials: string[]
}

function ShareCreateModal({ open, onClose, projectId, presetFolders, presetMaterials }: Props) {
  const { db, update, currentUser } = useApp()
  const [form] = Form.useForm()
  const [extraMaterials, setExtraMaterials] = useState<string[]>([])

  // 计算所选文件夹内的全部素材（递归）
  const folderMaterialIds = useMemo(() => {
    const folders = db.folders.filter((f) => f.projectId === projectId)
    const ids = new Set<string>()
    const walk = (fid: string) => {
      folders.filter((f) => f.parentId === fid).forEach((f) => {
        db.materials
          .filter((m) => m.folderId === f.id && m.status === '正常')
          .forEach((m) => ids.add(m.id))
        walk(f.id)
      })
    }
    db.materials
      .filter((m) => m.folderId && presetFolders.includes(m.folderId) && m.status === '正常')
      .forEach((m) => ids.add(m.id))
    presetFolders.forEach((fid) => walk(fid))
    return Array.from(ids)
  }, [db, projectId, presetFolders])

  const allMaterialIds = useMemo(
    () => Array.from(new Set([...folderMaterialIds, ...presetMaterials, ...extraMaterials])),
    [folderMaterialIds, presetMaterials, extraMaterials],
  )

  const totalSize = useMemo(
    () =>
      db.materials
        .filter((m) => allMaterialIds.includes(m.id))
        .reduce((s, m) => s + m.size, 0),
    [db, allMaterialIds],
  )

  const selectedFolders = db.folders.filter((f) => presetFolders.includes(f.id))
  const selectedFiles = db.materials.filter((m) => allMaterialIds.includes(m.id))

  const submit = () => {
    if (!allMaterialIds.length) {
      message.warning('未选择任何素材')
      return
    }
    form.validateFields().then((v) => {
      const next = { ...db }
      const expire = v.expireAt?.format('YYYY-MM-DD') ?? dayjs().add(7, 'day').format('YYYY-MM-DD')
      next.shares.push({
        id: uid('s'),
        materialIds: allMaterialIds,
        folderIds: presetFolders,
        projectId,
        password: v.password || undefined,
        expireAt: expire,
        accessMode: v.accessMode,
        downloadAllowed: !!v.downloadAllowed,
        createBy: currentUser?.id || '',
        createTime: new Date().toISOString().slice(0, 19),
        status: '有效',
        url: `https://mat.example/share/${uid('s')}`,
      })
      update(next)
      setExtraMaterials([])
      onClose()
      message.success(`外链已创建，共 ${allMaterialIds.length} 个素材`)
    })
  }

  const onOpen = () => {
    form.setFieldsValue({ accessMode: '免登录', downloadAllowed: false, expireAt: dayjs().add(7, 'day') })
  }

  return (
    <Modal
      title={<Space><LinkOutlined /> 创建外链分享</Space>}
      open={open}
      onOk={submit}
      onCancel={onClose}
      width={600}
      destroyOnClose
      afterOpenChange={(o) => o && onOpen()}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="分享内容">
          <div style={{ background: '#fafafa', borderRadius: 6, padding: 8, maxHeight: 140, overflow: 'auto' }}>
            {selectedFolders.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div className="muted" style={{ marginBottom: 4 }}>文件夹（含子目录，共 {folderMaterialIds.length} 个素材）</div>
                <Space wrap>
                  {selectedFolders.map((f) => (
                    <Tag key={f.id} color="gold">📁 {f.name}</Tag>
                  ))}
                </Space>
              </div>
            )}
            {(presetMaterials.length > 0 || extraMaterials.length > 0) && selectedFolders.length === 0 && (
              <div style={{ marginBottom: 6 }}>
                <div className="muted" style={{ marginBottom: 4 }}>文件</div>
              </div>
            )}
            {selectedFiles
              .filter((m) => !folderMaterialIds.includes(m.id))
              .map((m) => (
                <div key={m.id} className="ellipsis muted" style={{ fontSize: 13, padding: '1px 0' }}>
                  {m.name}（{fmtSize(m.size)}）
                </div>
              ))}
          </div>
        </Form.Item>
        <Form.Item label="追加分享文件（可选）">
          <Select
            mode="multiple"
            placeholder={selectedFolders.length ? '文件夹已包含内容，可选补充文件' : '选择要分享的文件'}
            style={{ width: '100%' }}
            value={extraMaterials}
            onChange={setExtraMaterials}
            maxTagCount="responsive"
            options={db.materials
              .filter((m) => m.projectId === projectId && m.status === '正常')
              .map((m) => ({ value: m.id, label: m.name }))}
          />
        </Form.Item>
        <Form.Item name="accessMode" label="访问方式" extra="免登录：点开链接直接查看，无需注册账号">
          <Select
            options={[
              { value: '免登录', label: '免登录（发链接直开）' },
              { value: '需登录', label: '需登录（验证账号）' },
            ]}
          />
        </Form.Item>
        <Form.Item name="downloadAllowed" label="允许下载" valuePropName="checked">
          <Switch checkedChildren="预览+下载" unCheckedChildren="仅预览" />
        </Form.Item>
        <Form.Item name="password" label="访问密码（可选）">
          <Input.Password placeholder="不填则无需密码" />
        </Form.Item>
        <Form.Item name="expireAt" label="有效期" extra="默认 7 天，到期自动失效">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
      <div className="muted">
        本次分享共 {allMaterialIds.length} 个素材，合计 {fmtSize(totalSize)}；创建后可在“外链分享”页撤回。
      </div>
    </Modal>
  )
}

export default ShareCreateModal