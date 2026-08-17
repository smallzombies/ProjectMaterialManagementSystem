import { useState } from 'react'
import { Modal, Upload, Button, Progress, message, Select, Form, Space, Tabs } from 'antd'
import { InboxOutlined, CloudUploadOutlined, FileZipOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { useApp } from '../store/AppContext'
import { typeOf, fmtSize } from '../utils/format'
import { uid } from '../mock/db'
import type { Material } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  parentFolderId: string | null
  folderPath: string
}

function UploadModal({ open, onClose, projectId, parentFolderId, folderPath }: Props) {
  const { db, refresh, update, currentUser, can } = useApp()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const onCloseAll = () => {
    setFileList([])
    setProgress(0)
    setUploading(false)
    onClose()
  }

  const doUpload = () => {
    form.validateFields().then((v) => {
      if (!fileList.length) {
        message.warning('请选择文件')
        return
      }
      setUploading(true)
      let p = 0
      const timer = setInterval(() => {
        p = Math.min(100, p + Math.floor(Math.random() * 30 + 5))
        setProgress(p)
        if (p >= 100) {
          clearInterval(timer)
          finishUpload(v)
        }
      }, 200)
    })
  }

  const finishUpload = (v: { folderId?: string; pointId?: string }) => {
    const next = { ...db }
    const now = new Date().toISOString().slice(0, 19)
    const targetFolder = v.folderId ?? parentFolderId
    const files = fileList.map((f) => {
      const size = f.size ?? 1024 * 1024
      const name = f.name ?? 'file.bin'
      const m: Material = {
        id: uid('m'),
        projectId,
        folderId: targetFolder,
        name,
        type: typeOf(name),
        size,
        uploaderId: currentUser?.id || 'u_zhao',
        uploadTime: now,
        shootingTime: now,
        pointId: v.pointId,
        tags: [],
        hasExif: typeOf(name) === 'image',
        versions: [{ version: 1, storageKey: `key/${uid('k')}`, fileHash: `hash${uid('h')}`, size, createBy: currentUser?.id || 'u_zhao', createTime: now, note: '首次上传' }],
        commentCount: 0,
        status: '正常',
      }
      next.logs.unshift({
        id: uid('l'),
        materialId: m.id,
        materialName: name,
        projectId,
        userId: currentUser?.id || '',
        actionType: '上传',
        detail: `上传至 ${folderPath || '根目录'}`,
        ip: '10.0.0.88',
        createdAt: now,
      })
      return m
    })
    next.materials.push(...files)
    update(next)
    refresh()
    message.success(`成功上传 ${files.length} 个文件`)
    onCloseAll()
  }

  const normalize = (f: UploadFile) => f as UploadFile

  const zipImport = () => {
    // ZIP 包裹式导入 - 扁平导入到目标文件夹
    const hasZip = fileList.some((f) => typeOf(f.name || 'x.x') === 'zip')
    message.info(hasZip ? 'ZIP 已选择：将扁平导入到目标文件夹（不自动建目录）' : '可选择 ZIP 包执行历史素材批量导入')
  }

  const foldersOfProject = db.folders.filter((f) => f.projectId === projectId)
  const pointsOfProject = db.points.filter((p) => p.projectId === projectId && p.status === '启用')

  return (
    <Modal
      open={open}
      onCancel={onCloseAll}
      onOk={doUpload}
      okText={uploading ? '上传中…' : '开始上传'}
      confirmLoading={uploading}
      width={640}
      title={<Space><CloudUploadOutlined /> 上传素材</Space>}
      destroyOnClose
    >
      <Tabs
        items={[
          {
            key: 'upload',
            label: '上传文件',
            children: (
              <Form form={form} layout="vertical" initialValues={{ folderId: parentFolderId || undefined }}>
                <Form.Item name="folderId" label="上传至文件夹">
                  <Select
                    allowClear
                    placeholder={folderPath || '根目录'}
                    options={foldersOfProject.map((f) => ({ value: f.id, label: f.name }))}
                  />
                </Form.Item>
                <Form.Item name="pointId" label="拍摄船舱（可选）">
                  <Select allowClear placeholder="选择船舱" options={pointsOfProject.map((p) => ({ value: p.id, label: `${p.name}(${p.code})` }))} />
                </Form.Item>
                <Upload.Dragger
                  multiple
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList: fl }) => setFileList(fl)}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此处</p>
                  <p className="ant-upload-hint">
                    支持照片、视频、PDF、CAD、Office、压缩包、三维模型/点云；单文件不限大小
                  </p>
                </Upload.Dragger>
                {uploading && <Progress percent={progress} status="active" style={{ marginTop: 12 }} />}
              </Form>
            ),
          },
          {
            key: 'zip',
            label: 'ZIP 批量导入',
            children: (
              <div>
                <Form layout="vertical">
                  <Form.Item label="选择 ZIP 压缩包（扁平导入，不自动建目录）">
                    <Upload.Dragger
                      multiple={false}
                      accept=".zip"
                      beforeUpload={() => false}
                      onChange={({ fileList: fl }) => {
                        setFileList(fl)
                        zipImport()
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <FileZipOutlined />
                      </p>
                      <p className="ant-upload-text">选择历史素材 ZIP 包</p>
                      <p className="ant-upload-hint">导入文件将直接进入目标文件夹，相同文件名按重名策略处理</p>
                    </Upload.Dragger>
                  </Form.Item>
                </Form>
                <Button type="primary" block icon={<FileZipOutlined />} disabled={!fileList.length} onClick={doUpload}>
                  开始导入
                </Button>
              </div>
            ),
          },
        ]}
      />

      {fileList.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Space direction="vertical" size={2}>
            {fileList.map((f) => {
              const nf = normalize(f)
              return (
                <div key={nf.uid} className="muted ellipsis" style={{ maxWidth: 560 }}>
                  {nf.name}（{fmtSize(nf.size ?? 0)}）
                </div>
              )
            })}
          </Space>
        </div>
      )}
      {!can('material.upload') && (
        <div style={{ marginTop: 8 }} className="muted">
          当前角色无上传权限（需 material.upload）
        </div>
      )}
    </Modal>
  )
}

export default UploadModal