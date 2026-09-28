import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Layout,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Dropdown,
  message,
  Checkbox,
  Modal,
  Form,
  Popconfirm,
  Table,
  Tooltip,
  Row,
  Col,
  Empty,
  Grid,
  TreeSelect,
  Breadcrumb,
  Divider,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AppstoreOutlined,
  BarsOutlined,
  CloudUploadOutlined,
  SearchOutlined,
  DownOutlined,
  FolderAddOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
  TagsOutlined,
  AimOutlined,
  DeleteOutlined,
  CopyOutlined,
  SwitcherOutlined,
  EditOutlined,
  ReloadOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { uid } from '../mock/db'
import { useApp } from '../store/AppContext'
import { materialsApi, foldersApi, logsApi, trashApi, tagsApi, downloadApi } from '../api/services'
import { fmtSize, fmtDate, fileIcon, thumbUrl, TYPE_LABEL } from '../utils/format'
import type { Material } from '../types'
import FilePreview from '../components/FilePreview'
import UploadModal from '../components/UploadModal'
import ShareCreateModal from '../components/ShareCreateModal'

const { Sider, Content } = Layout

type ViewMode = 'grid' | 'small' | 'list'

function ProjectFiles() {
  const { projectId = '' } = useParams()
  const { db, refresh, update, currentUser, can, unitConfig, loadProjectData } = useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [folderId, setFolderId] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>('grid')
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [approvalFilter, setApprovalFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [pointFilter, setPointFilter] = useState<string>('all')
  const [pointKeyword, setPointKeyword] = useState('')
  const [sortBy, setSortBy] = useState('time_desc')
  const [selected, setSelected] = useState<string[]>([])
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<Material | null>(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderForm] = Form.useForm()
  const [renameForm] = Form.useForm()
  const [renameTarget, setRenameTarget] = useState<{ kind: 'folder' | 'material'; id: string; name: string } | null>(null)
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveForm] = Form.useForm()
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [batchTagSearch, setBatchTagSearch] = useState('')
  const [pointModalOpen, setPointModalOpen] = useState(false)
  const [pointForm] = Form.useForm()
  const [exifConfirm, setExifConfirm] = useState(false)
  const [renameBatchOpen, setRenameBatchOpen] = useState(false)
  const [renameBatchForm] = Form.useForm()
  const [shareOpen, setShareOpen] = useState(false)
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const marqueeActiveRef = useRef(false)
  const marqueeRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const suppressClickRef = useRef(false)
  const longPressTimer = useRef<number | undefined>(undefined)

  const setMarqueeBoth = (box: { x1: number; y1: number; x2: number; y2: number } | null) => {
    marqueeRef.current = box
    setMarquee(box)
  }

  useEffect(() => {
    if (projectId) loadProjectData(projectId)
  }, [projectId])

  const project = db.projects.find((p) => p.id === projectId)
  const folders = db.folders.filter((f) => f.projectId === projectId)
  const points = db.points.filter((p) => p.projectId === projectId)

  const folderPath = useMemo(() => {
    if (!folderId) return project?.name || ''
    const path: string[] = []
    let cur = folders.find((f) => f.id === folderId)
    while (cur) {
      path.unshift(cur.name)
      cur = folders.find((f) => f.id === cur?.parentId)
    }
    return `${project?.name} / ${path.join(' / ')}`
  }, [folderId, folders, project])

  const breadcrumbs = useMemo(() => {
    const crumb: { id: string | null; name: string }[] = [{ id: null, name: project?.name || '项目' }]
    if (!folderId) return crumb
    const chain: { id: string; name: string }[] = []
    let cur = folders.find((f) => f.id === folderId)
    while (cur) {
      chain.unshift({ id: cur.id, name: cur.name })
      cur = folders.find((f) => f.id === cur?.parentId)
    }
    return [...crumb, ...chain]
  }, [folderId, folders, project])

  const jumpTo = (id: string | null) => {
    setFolderId(id)
    setSelected([])
    setSelectedFolders([])
  }

  const childMaterials = useMemo(() => {
    let list = db.materials.filter(
      (m) => m.projectId === projectId && (folderId ? m.folderId === folderId : true) && m.status === '正常',
    )
    if (!folderId) {
      // 根目录只显示未归档的素材
      list = db.materials.filter((m) => m.projectId === projectId && m.status === '正常' && !m.folderId)
    }
    if (keyword) {
      list = list.filter((m) => m.name.toLowerCase().includes(keyword.toLowerCase()))
    }
    if (typeFilter !== 'all') list = list.filter((m) => m.type === typeFilter)
    if (!unitConfig.showFailed) list = list.filter((m) => m.approval !== '不合格')
    if (approvalFilter !== 'all') list = list.filter((m) => m.approval === approvalFilter)
    if (pointFilter !== 'all') list = list.filter((m) => m.pointId === pointFilter)
    if (tagFilter.length) {
      list = list.filter((m) => tagFilter.every((t) => m.tags.includes(t)))
    }
    switch (sortBy) {
      case 'time_desc':
        list = [...list].sort((a, b) => b.uploadTime.localeCompare(a.uploadTime))
        break
      case 'time_asc':
        list = [...list].sort((a, b) => a.uploadTime.localeCompare(b.uploadTime))
        break
      case 'name_asc':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'size_desc':
        list = [...list].sort((a, b) => b.size - a.size)
        break
    }
    return list
  }, [db, projectId, folderId, keyword, typeFilter, approvalFilter, pointFilter, tagFilter, sortBy, unitConfig])

  // 子文件夹
  const childFolders = useMemo(() => {
    let list = folders.filter((f) => f.parentId === folderId)
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [folders, folderId])

  const folderOptions = useMemo(() => {
    const opts: { value: string; label: React.ReactNode }[] = [{ value: '', label: project?.name || '项目根目录' }]
    const walk = (pid: string | null, depth: number) => {
      folders
        .filter((f) => f.parentId === pid)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((f) => {
          opts.push({ value: f.id, label: <span>{'　'.repeat(depth)}{f.name}</span> })
          walk(f.id, depth + 1)
        })
    }
    walk(null, 1)
    return opts
  }, [folders, project])

  const tagTree = (pid: string | null): any[] =>
    db.tags
      .filter((t) => t.parentId === pid)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ value: t.id, title: t.name, children: tagTree(t.id) }))

  const flatTagOptions = useMemo(() => {
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
  }, [db.tags])

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const toggleFolderSelect = (id: string) => {
    setSelectedFolders((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const allChildIds = useMemo(() => {
    const mats = childMaterials.map((m) => m.id)
    const subs: string[] = []
    const walk = (pid: string | null) => {
      folders.filter((f) => f.parentId === pid).forEach((f) => {
        db.materials.forEach((m) => {
          if (m.folderId === f.id && m.status === '正常') subs.push(m.id)
        })
        walk(f.id)
      })
    }
    walk(folderId)
    return [...mats, ...subs]
  }, [childMaterials, folders, db, folderId])

  const allChecked = allChildIds.length > 0 && allChildIds.every((id) => selected.includes(id))

  const selectAll = (checked: boolean) => {
    if (checked) setSelected([...new Set([...selected, ...allChildIds])])
    else setSelected([])
  }

  const canUpload = can('material.upload')
  const canEdit = can('material.edit')
  const canDelete = can('material.delete')
  const canFolder = can('folder.manage')

  // ---- 操作实现 ----
  const createFolder = async () => {
    try {
      const v = await newFolderForm.validateFields()
      await foldersApi.create({ projectId, parentId: folderId, name: v.name, remark: v.remark })
      await loadProjectData(projectId)
      message.success('文件夹已创建')
      setNewFolderOpen(false)
    } catch { /* validation error */ }
  }

  const doRename = async () => {
    if (!renameTarget) return
    try {
      const v = await renameForm.validateFields()
      if (renameTarget.kind === 'folder') {
        await foldersApi.update(renameTarget.id, { name: v.name })
      } else {
        await materialsApi.rename(renameTarget.id, v.name)
      }
      await loadProjectData(projectId)
      message.success('重命名成功')
      setRenameTarget(null)
    } catch { /* ignore */ }
  }

  const doDelete = async (ids: string[] = selected) => {
    try {
      // 收集选中文件夹内的所有素材
      const folderMaterialIds: string[] = []
      const walkFolders = (pid: string) => {
        folders.filter((f) => f.parentId === pid).forEach((f) => {
          db.materials.forEach((m) => {
            if (m.folderId === f.id && m.status === '正常') folderMaterialIds.push(m.id)
          })
          walkFolders(f.id)
        })
      }
      selectedFolders.forEach((fid) => {
        db.materials.forEach((m) => {
          if (m.folderId === fid && m.status === '正常') folderMaterialIds.push(m.id)
        })
        walkFolders(fid)
      })
      const allIds = [...new Set([...ids, ...folderMaterialIds])]
      // 移入后端回收站
      await Promise.all(
        allIds.map((id) => {
          const m = db.materials.find((x) => x.id === id)
          return m ? trashApi.create(m) : Promise.resolve()
        }),
      )
      // 删除选中的文件夹
      for (const fid of selectedFolders) {
        await foldersApi.remove(fid)
      }
      await logsApi.create({
        projectId,
        userId: currentUser?.id || '',
        actionType: '删除',
        detail: `删除至回收站（${allIds.length} 个文件，${selectedFolders.length} 个文件夹）`,
        ip: '10.0.0.88',
      })
      await loadProjectData(projectId)
      setSelected([])
      setSelectedFolders([])
      message.success('已删除至回收站')
    } catch (e: any) {
      message.error(e?.message || '删除失败')
    }
  }

  const doClearExif = async () => {
    try {
      await materialsApi.batchClearExif(selected)
      await loadProjectData(projectId)
      message.success('EXIF 已批量清除')
    } catch { /* ignore */ }
  }

  const doMove = async () => {
    try {
      const v = await moveForm.validateFields()
      const mode = v.mode === 'copy' ? '复制' : '移动'
      if (v.mode === 'copy') {
        for (const id of selected) {
          const src = db.materials.find((m) => m.id === id)
          if (src) {
            await materialsApi.create({ ...src, id: undefined, folderId: v.targetFolder ?? null })
          }
        }
      } else {
        await materialsApi.batchMove(selected, v.targetFolder ?? null)
      }
      await logsApi.create({
        projectId,
        userId: currentUser?.id || '',
        actionType: mode,
        detail: `${mode} ${selected.length} 个文件 → ${v.targetFolder ? folders.find((f) => f.id === v.targetFolder)?.name : '根目录'}`,
        ip: '10.0.0.88',
      })
      await loadProjectData(projectId)
      setSelected([])
      setMoveOpen(false)
      message.success(`已${mode} ${selected.length} 个文件`)
    } catch { /* ignore */ }
  }

  const doTag = async () => {
    try {
      await materialsApi.batchTag(selected, selectedTags)
      await logsApi.create({
        projectId,
        userId: currentUser?.id || '',
        actionType: '打标签',
        detail: `批量为 ${selected.length} 个文件添加标签`,
        ip: '10.0.0.88',
      })
      await loadProjectData(projectId)
      setSelectedTags([])
      setTagModalOpen(false)
      message.success('标签已添加')
    } catch { /* ignore */ }
  }

    const createBatchTag = async () => {
    const name = batchTagSearch.trim()
    if (!name) {
      message.warning('请先输入标签名称')
      return
    }
    const existing = db.tags.find((t) => t.name === name)
    if (existing) {
      setSelectedTags((s) => (s.includes(existing.id) ? s : [...s, existing.id]))
      setBatchTagSearch('')
      message.success('已添加现有标签')
      return
    }
    try {
      const newTag = await tagsApi.create({ name, parentId: null })
      await loadProjectData(projectId)
      setSelectedTags((s) => [...s, newTag.id])
      setBatchTagSearch('')
      message.success(`已创建标签"${name}"并归入"未分类"`)
    } catch {
      message.error('标签创建失败')
    }
  }

  const doPoint = async () => {
    try {
      const v = await pointForm.validateFields()
      await materialsApi.batchPoint(selected, v.pointId)
      await loadProjectData(projectId)
      setPointModalOpen(false)
      message.success('船舱已设置')
    } catch { /* ignore */ }
  }

  const doBatchRename = async () => {
    try {
      const v = await renameBatchForm.validateFields()
      const template = (v.template || 'batch') as string
      const customText = (v.customText || '') as string
      const renames: { id: string; name: string }[] = []
      selected.forEach((id, i) => {
        const m = db.materials.find((x) => x.id === id)
        if (!m) return
        const seq = String(i + 1).padStart(3, '0')
        const base =
          template === 'num'
            ? `${project?.name}_第${seq}个`
            : template === 'time'
              ? `${m.name.split('.')[0]}_${m.shootingTime?.slice(0, 10)}_${seq}`
              : `${project?.name}_${folderPath.replace(/\//g, '_')}_${seq}`
        const ext = m.name.includes('.') ? m.name.slice(m.name.lastIndexOf('.')) : ''
        const parts = [base]
        if (v.includeUploader) parts.push(currentUser?.name || '')
        if (customText) parts.push(customText)
        renames.push({ id, name: parts.join('_') + ext })
      })
      for (const r of renames) {
        await materialsApi.rename(r.id, r.name)
      }
      await loadProjectData(projectId)
      setRenameBatchOpen(false)
      setSelected([])
      message.success('批量重命名完成')
    } catch { /* ignore */ }
  }

  const download = async (ids: string[]) => {
    if (!ids.length) { message.warning('请先选择文件'); return }
    try {
      await downloadApi.zip(ids)
      message.success('下载完成')
    } catch {
      message.error('下载失败')
    }
  }

  const relCoords = (e: { clientX: number; clientY: number }) => {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return { x: e.clientX, y: e.clientY }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onGridMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('.ant-checkbox-wrapper, button, a, input, .ant-select, .ant-input, .ant-dropdown, .ant-popconfirm, .ant-pagination')) return
    // 阻止浏览器原生文本选择
    e.preventDefault()
    const start = relCoords(e)
    dragStartRef.current = start
    marqueeActiveRef.current = false
    suppressClickRef.current = false
    setMarqueeBoth(null)
    window.clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => {
      if (dragStartRef.current) {
        marqueeActiveRef.current = true
        setMarqueeBoth({ x1: start.x, y1: start.y, x2: start.x, y2: start.y })
      }
    }, 180)

    const move = (ev: MouseEvent) => {
      const s = dragStartRef.current
      if (!s) return
      const rect = gridRef.current?.getBoundingClientRect()
      const cx = ev.clientX - (rect?.left || 0)
      const cy = ev.clientY - (rect?.top || 0)
      const dx = cx - s.x
      const dy = cy - s.y
      if (!marqueeActiveRef.current) {
        if (Math.abs(dx) + Math.abs(dy) < 5) return
        window.clearTimeout(longPressTimer.current)
        marqueeActiveRef.current = true
      }
      setMarqueeBoth({ x1: Math.min(s.x, cx), y1: Math.min(s.y, cy), x2: Math.max(s.x, cx), y2: Math.max(s.y, cy) })
    }

    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.clearTimeout(longPressTimer.current)
      const s = dragStartRef.current
      dragStartRef.current = null
      const active = marqueeActiveRef.current
      marqueeActiveRef.current = false
      const m = marqueeRef.current
      setMarqueeBoth(null)
      document.body.style.userSelect = ''
      if (active && s && m && gridRef.current && (Math.abs(m.x2 - m.x1) > 3 || Math.abs(m.y2 - m.y1) > 3)) {
        const files: string[] = []
        const folders: string[] = []
        gridRef.current.querySelectorAll<HTMLElement>('[data-selectable]').forEach((el) => {
          const r = el.getBoundingClientRect()
          const g = gridRef.current!.getBoundingClientRect()
          const elRel = { left: r.left - g.left, top: r.top - g.top, right: r.right - g.left, bottom: r.bottom - g.top }
          const hit = !(elRel.right < m.x1 || elRel.left > m.x2 || elRel.bottom < m.y1 || elRel.top > m.y2)
          if (hit) {
            const kind = el.dataset.selectable
            if (kind?.startsWith('m:')) files.push(kind.slice(2))
            else if (kind?.startsWith('f:')) folders.push(kind.slice(2))
          }
        })
        if (files.length || folders.length) {
          setSelected(files)
          setSelectedFolders(folders)
        }
        suppressClickRef.current = true
        window.setTimeout(() => { suppressClickRef.current = false }, 0)
      }
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    document.body.style.userSelect = 'none'
  }

  // ---- 渲染 ----
  const renderGridItem = (m: Material) => {
    const thumb = thumbUrl(m.name, m.id)
    return (
      <Card
        size="small"
        hoverable
        data-selectable={`m:${m.id}`}
        className={`file-card ${selected.includes(m.id) ? 'file-card-selected' : ''}`}
        onClick={(e) => {
          if (suppressClickRef.current) return
          if (e.shiftKey) { toggleSelect(m.id); return }
          setPreview(m)
        }}
        cover={
          <div style={{ height: view === 'small' ? 130 : 190, overflow: 'hidden', background: '#f0f2f5', position: 'relative' }}>
            {thumb ? (
              <img src={thumb} className="thumb-img" alt={m.name} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 40 }}>{fileIcon(m.type)}</span>
              </div>
            )}
            <div style={{ position: 'absolute', top: 6, right: 6 }}>
              <Checkbox
                checked={selected.includes(m.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation()
                  toggleSelect(m.id)
                }}
              />
            </div>
            {m.commentCount > 0 && <Tag color="orange" style={{ position: 'absolute', top: 6, left: 6, margin: 0 }}>{m.commentCount} 条批注</Tag>}
            {!m.hasExif && m.type === 'image' && <Tag color="green" style={{ position: 'absolute', bottom: 6, left: 6, margin: 0 }}>无EXIF</Tag>}
          </div>
        }
      >
        <Card.Meta
          title={
            <Tooltip title={m.name}>
              <div className="ellipsis" style={{ fontSize: 13 }}>{m.name}</div>
            </Tooltip>
          }
          description={
            <div>
              <Tag style={{ marginRight: 4 }} color="default">{TYPE_LABEL[m.type]}</Tag>
              <span className="muted">{fmtSize(m.size)}</span>
              {m.approval && <Tag color={m.approval === '合格' ? 'green' : 'red'} style={{ marginLeft: 4 }}>{m.approval}</Tag>}
            </div>
          }
        />
      </Card>
    )
  }

  const tableColumns: ColumnsType<Material> = [
    {
      title: () => <Checkbox checked={allChecked} onChange={(e) => selectAll(e.target.checked)} />,
      width: 40,
      render: (_, r) => <Checkbox checked={selected.includes(r.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelect(r.id)} />,
    },
    { title: '文件名', dataIndex: 'name', render: (t: string) => <span>{t}</span> },
    { title: '类型', dataIndex: 'type', width: 90, render: (t: string) => <Tag>{TYPE_LABEL[t as Material['type']]}</Tag> },
    { title: '大小', dataIndex: 'size', width: 100, render: (s: number) => fmtSize(s) },
    { title: '上传人', dataIndex: 'uploaderId', width: 100, render: (v: string) => db.users.find((u) => u.id === v)?.name || '-' },
    { title: '上传时间', dataIndex: 'uploadTime', width: 140, render: (v: string) => fmtDate(v) },
    { title: '船舱', dataIndex: 'pointId', width: 120, render: (v?: string) => points.find((p) => p.id === v)?.name || '-' },
    { title: '审批意见', dataIndex: 'approval', width: 100, render: (v?: string) => v ? <Tag color={v === '合格' ? 'green' : 'red'}>{v}</Tag> : <span className="muted">-</span> },
    { title: '标签', dataIndex: 'tags', render: (t: string[]) => (t.length ? t.map((x) => <Tag key={x} color="blue" style={{ margin: 1 }}>{db.tags.find((q) => q.id === x)?.name || x}</Tag>) : '-') },
    {
      title: '操作',
      width: 130,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => setPreview(r)}>预览</Button>
          {canEdit && <Button type="link" size="small" onClick={() => { setRenameTarget({ kind: 'material', id: r.id, name: r.name }); renameForm.setFieldsValue({ name: r.name }) }}>重命名</Button>}
          {canEdit && <Button type="link" size="small" danger onClick={() => doDelete([r.id])}>删除</Button>}
        </Space>
      ),
    },
  ]

  return (
    <Layout
      style={{
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        height: isMobile ? 'auto' : 'calc(100vh - 73px)',
        minHeight: 480,
      }}
    >
      {!isMobile && (
        <Sider width={260} theme="light" style={{ borderRight: '1px solid #f0f0f0', background: '#fff' }}>
          <div style={{ padding: '12px 12px 4px' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索船舱"
              value={pointKeyword}
              onChange={(e) => setPointKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ padding: '0 8px 8px', maxHeight: 'calc(100vh - 150px)', overflow: 'auto' }}>
            <div
              onClick={() => {
                setPointFilter('all')
                setFolderId(null)
                setSelected([])
                setSelectedFolders([])
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: 6,
                marginBottom: 4,
                background: pointFilter === 'all' ? '#e6f4ff' : 'transparent',
                color: pointFilter === 'all' ? '#1677ff' : 'inherit',
                fontWeight: pointFilter === 'all' ? 600 : 400,
              }}
            >
              全部船舱
            </div>
            {points
              .filter((p) => p.name.toLowerCase().includes(pointKeyword.toLowerCase()))
              .map((p) => {
                const count = db.materials.filter((m) => m.pointId === p.id && m.status === '正常').length
                const active = pointFilter === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setPointFilter(p.id)
                      setFolderId(null)
                      setSelected([])
                      setSelectedFolders([])
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: 6,
                      marginBottom: 4,
                      background: active ? '#e6f4ff' : 'transparent',
                      color: active ? '#1677ff' : 'inherit',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{p.name}</span>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </Sider>
      )}

      <Content style={{ padding: isMobile ? 8 : 12, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="muted" style={{ fontSize: 13 }}>当前船舱</span>
          <Tag color={pointFilter === 'all' ? 'default' : 'blue'}>
            {pointFilter === 'all' ? '全部船舱' : (points.find((p) => p.id === pointFilter)?.name || '全部船舱')}
          </Tag>
        </div>
        <div className="toolbar" style={{ marginBottom: 8 }}>
          {isMobile ? (
            <Space style={{ flex: 1, minWidth: 0 }} wrap>
              <Select
                style={{ width: 140 }}
                value={pointFilter}
                onChange={(v) => {
                  setPointFilter(v)
                  setFolderId(null)
                  setSelected([])
                  setSelectedFolders([])
                }}
                options={[{ value: 'all', label: '全部船舱' }, ...points.map((p) => ({ value: p.id, label: p.name }))]}
              />
              <Select
                style={{ flex: 1, minWidth: 0 }}
                value={folderId || ''}
                onChange={(v) => {
                  setFolderId(v || null)
                  setSelected([])
                  setSelectedFolders([])
                }}
                options={folderOptions}
              />
            </Space>
          ) : (
            <Breadcrumb
              style={{ flex: 1, minWidth: 0, fontSize: 15 }}
              items={breadcrumbs.map((b, i) => ({
                title:
                  i < breadcrumbs.length - 1 ? (
                    <a onClick={() => jumpTo(b.id)}>{b.name}</a>
                  ) : (
                    <span className="folder-title">{b.name}</span>
                  ),
              }))}
            />
          )}
          <Space>
            <Button
              size={isMobile ? 'small' : 'middle'}
              icon={<FolderAddOutlined />}
              disabled={!canFolder}
              onClick={() => setNewFolderOpen(true)}
            >
              新建文件夹
            </Button>
            {canUpload && (
              <Button
                size={isMobile ? 'small' : 'middle'}
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => setUploadOpen(true)}
              >
                上传
              </Button>
            )}
          </Space>
        </div>

        <div className="toolbar">
          <Space wrap>
            <Input.Search
              placeholder="搜索文件"
              style={{ width: isMobile ? 150 : 220 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={(v) => setKeyword(v)}
            />
            <Select
              value={typeFilter}
              style={{ width: isMobile ? 110 : 110 }}
              onChange={setTypeFilter}
              options={[{ value: 'all', label: '全部类型' }, ...Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))]}
            />
            <Select
              value={approvalFilter}
              style={{ width: isMobile ? 120 : 120 }}
              onChange={setApprovalFilter}
              options={[
                { value: 'all', label: '审批全部' },
                { value: '合格', label: '合格' },
                ...(unitConfig.showFailed ? [{ value: '不合格', label: '不合格' }] : []),
              ]}
            />
            <TreeSelect
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              placeholder="按标签筛选"
              style={{ width: isMobile ? 150 : 200 }}
              value={tagFilter}
              onChange={setTagFilter}
              treeData={tagTree(null)}
              treeDefaultExpandAll
            />
            <Input.Group compact>
              <Input style={{ width: 62, borderRight: 0 }} disabled value="排序" prefix={<SortAscendingOutlined />} />
              <Select
                value={sortBy}
                style={{ width: isMobile ? 130 : 160 }}
                onChange={setSortBy}
                options={[
                  { value: 'time_desc', label: '时间 新→旧' },
                  { value: 'time_asc', label: '时间 旧→新' },
                  { value: 'name_asc', label: '名称 A-Z' },
                  { value: 'size_desc', label: '大小 大→小' },
                ]}
              />
            </Input.Group>
          </Space>
          <div style={{ marginLeft: 'auto' }}>
            <Space>
              <span className="muted" style={{ fontSize: 12 }}>按住左键拖动/长按可框选</span>
              <Tooltip title="大缩略图">
                <Button icon={<AppstoreOutlined />} size={isMobile ? 'small' : 'middle'} type={view === 'grid' ? 'primary' : 'default'} onClick={() => setView('grid')} />
              </Tooltip>
              <Tooltip title="小缩略图">
                <Button icon={<BarsOutlined />} size={isMobile ? 'small' : 'middle'} type={view === 'small' ? 'primary' : 'default'} onClick={() => setView('small')} />
              </Tooltip>
              <Tooltip title="列表视图">
                <Button icon={<BarsOutlined />} size={isMobile ? 'small' : 'middle'} type={view === 'list' ? 'primary' : 'default'} onClick={() => setView('list')} />
              </Tooltip>
            </Space>
          </div>
        </div>

        <div
          ref={gridRef}
          style={{ position: 'relative' }}
          onMouseDown={onGridMouseDown}
        >
          <Row gutter={[12, 12]}>
            {childFolders.map((f) => (
              <Col xs={12} sm={12} md={8} lg={6} xl={4} key={f.id}>
                <Card
                  size="small"
                  hoverable
                  data-selectable={`f:${f.id}`}
                  className={selectedFolders.includes(f.id) ? 'file-card-selected' : ''}
                  onClick={(e) => {
                    if (suppressClickRef.current) return
                    if (e.shiftKey) { toggleFolderSelect(f.id); return }
                    setFolderId(f.id)
                    setSelectedFolders([])
                  }}
                cover={
                  <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
                    <Checkbox
                      checked={selectedFolders.includes(f.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleFolderSelect(f.id)
                      }}
                    />
                  </div>
                }
              >
                <Space>
                  <span style={{ fontSize: 28 }}>📁</span>
                  <div>
                    <div className="ellipsis" style={{ maxWidth: 130 }}>{f.name}</div>
                    {f.remark && <div className="muted ellipsis" style={{ maxWidth: 130 }}>{f.remark}</div>}
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {view === 'list' && !isMobile ? (
          <Table
            rowKey="id"
            size="small"
            columns={tableColumns}
            dataSource={childMaterials}
            pagination={false}
            onRow={(r) => ({
              onClick: (ev: React.MouseEvent) => {
                if (suppressClickRef.current) return
                if (ev.shiftKey) { toggleSelect(r.id); return }
                setPreview(r)
              },
            })}
            locale={{ emptyText: <Empty description="暂无素材" /> }}
          />
        ) : (
          <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} style={{ marginTop: childFolders.length ? 12 : 0 }}>
            {childMaterials.map((m) => (
              <Col xs={12} sm={12} md={8} lg={view === 'small' ? 8 : 6} xl={view === 'small' ? 6 : 4} key={m.id}>
                {renderGridItem(m)}
              </Col>
            ))}
            {childMaterials.length === 0 && childFolders.length === 0 && (
              <Col span={24}>
                <Empty description={keyword ? '未找到匹配素材' : '此文件夹暂无素材，点击上方"上传"'}>
                  {canUpload && <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setUploadOpen(true)}>上传素材</Button>}
                </Empty>
              </Col>
            )}
          </Row>
        )}

          {marquee && (
            <div
              style={{
                position: 'absolute',
                left: marquee.x1,
                top: marquee.y1,
                width: marquee.x2 - marquee.x1,
                height: marquee.y2 - marquee.y1,
                border: '1px dashed #1677ff',
                background: 'rgba(22,119,255,0.1)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            />
          )}
        </div>

        {(selected.length > 0 || selectedFolders.length > 0 || allChildIds.length > 0) && (
          <div className="batch-bar" style={isMobile ? { left: 12, right: 12 } : { left: 296, right: 28, marginTop: 12 }}>
            <Checkbox checked={allChecked} onChange={(e) => selectAll(e.target.checked)}>
              全选
            </Checkbox>
            <span>已选 {selectedFolders.length} 个文件夹、{selected.length} 个文件</span>
            <Space wrap>
              <Button size="small" icon={<DownloadOutlined />} onClick={() => download(selected)}>
                打包下载
              </Button>
            {can('share.send') && (
              <Button
                size="small"
                type="primary"
                icon={<LinkOutlined />}
                onClick={() => setShareOpen(true)}
                disabled={!selected.length && !selectedFolders.length}
              >
                外链分享
              </Button>
            )}
            {can('material.tag') && (
              <Button size="small" icon={<TagsOutlined />} onClick={() => setTagModalOpen(true)}>
                打标
              </Button>
            )}
            {canEdit && (
              <Button size="small" icon={<AimOutlined />} onClick={() => setPointModalOpen(true)}>
                船舱
              </Button>
            )}
            {canEdit && (
              <Button size="small" icon={<EditOutlined />} onClick={() => setRenameBatchOpen(true)}>
                重命名
              </Button>
            )}
            {canEdit && (
              <Dropdown
                menu={{
                  items: [
                    { key: 'move', label: '移动到文件夹', icon: <SwitcherOutlined />, onClick: () => setMoveOpen(true) },
                    { key: 'copy', label: '复制到文件夹', icon: <CopyOutlined />, onClick: () => { moveForm.setFieldsValue({ mode: 'copy' }); setMoveOpen(true) } },
                    { key: 'exif', label: '批量清除EXIF', icon: <ReloadOutlined />, onClick: () => setExifConfirm(true) },
                  ],
                }}
              >
                <Button size="small">
                  更多 <DownOutlined />
                </Button>
              </Dropdown>
            )}
            {canDelete && (
              <Popconfirm title="确定将选中的内容放入回收站吗？" onConfirm={() => doDelete()}>
                <Button size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )}
            </Space>
          </div>
        )}
      </Content>

      <Modal title="新建文件夹" open={newFolderOpen} onOk={createFolder} onCancel={() => setNewFolderOpen(false)} destroyOnClose>
        <Form form={newFolderForm} layout="vertical">
          <Form.Item name="name" label="文件夹名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：桩基施工" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="可选，如归档说明、命名规范" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="重命名" open={!!renameTarget} onOk={doRename} onCancel={() => setRenameTarget(null)} destroyOnClose>
        <Form form={renameForm} layout="vertical">
          <Form.Item name="name" label="新名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="移动到 / 复制到" open={moveOpen} onOk={doMove} onCancel={() => setMoveOpen(false)} destroyOnClose>
        <Form form={moveForm} layout="vertical">
          <Form.Item name="mode" label="操作模式" initialValue="move">
            <Select
              options={[
                { value: 'move', label: '移动（原位置移除）' },
                { value: 'copy', label: '复制（保留原文件）' },
              ]}
            />
          </Form.Item>
          <Form.Item name="targetFolder" label="目标文件夹">
            <Select
              allowClear
              placeholder="根目录"
              options={folders.map((f) => ({ value: f.id, label: f.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量打标签" open={tagModalOpen} onOk={doTag} onCancel={() => setTagModalOpen(false)} destroyOnClose>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="搜索选择 / 创建标签"
          value={selectedTags}
          onChange={setSelectedTags}
          onSearch={setBatchTagSearch}
          optionFilterProp="label"
          options={flatTagOptions.map((t) => ({ value: t.id, label: t.path }))}
          dropdownRender={(menu) => (
            <div style={{ minWidth: 180 }}>
              {menu}
              <Divider style={{ margin: '4px 0' }} />
              <Button size="small" block type="link" icon={<PlusOutlined />} onClick={createBatchTag}>
                新建标签“{batchTagSearch || '未输入名称'}”（归入未分类）
              </Button>
            </div>
          )}
        />
        <div className="muted" style={{ marginTop: 8 }}>向选中的 {selected.length} 个文件追加标签，多人打标不互斥</div>
      </Modal>

      <Modal title="批量指定船舱" open={pointModalOpen} onOk={doPoint} onCancel={() => setPointModalOpen(false)} destroyOnClose>
        <Form form={pointForm} layout="vertical">
          <Form.Item name="pointId" label="选择船舱" rules={[{ required: true, message: '请选择船舱' }]}>
            <Select placeholder="选择船舱" options={points.filter((p) => p.status === '启用').map((p) => ({ value: p.id, label: `${p.name}(${p.code})` }))} />
          </Form.Item>
        </Form>
        <div className="muted">将为选中的 {selected.length} 个文件绑定该船舱</div>
      </Modal>

      <Modal title="批量重命名" open={renameBatchOpen} onOk={doBatchRename} onCancel={() => setRenameBatchOpen(false)} destroyOnClose>
        <Form form={renameBatchForm} layout="vertical" initialValues={{ template: 'folder', includeUploader: false }}>
          <Form.Item name="template" label="命名规则">
            <Select
              options={[
                { value: 'folder', label: '按文件夹层级（项目_层级_序号）' },
                { value: 'time', label: '拍摄时间_序号' },
                { value: 'num', label: '仅序号（项目_序号）' },
              ]}
            />
          </Form.Item>
          <Form.Item name="includeUploader" label="添加上传人" valuePropName="checked">
            <Checkbox>{`附加"_${'上传人'}"`}</Checkbox>
          </Form.Item>
          <Form.Item name="customText" label="自定义文本">
            <Input placeholder="可选，附加到名称末尾" />
          </Form.Item>
          <div className="muted">
            将作用于选中的 {selected.length} 个文件，先预览后执行
          </div>
        </Form>
      </Modal>

      <Modal title="确认批量清除 EXIF" open={exifConfirm} onOk={doClearExif} onCancel={() => setExifConfirm(false)} okButtonProps={{ danger: true }}>
        <p>将清除选中的 {selected.length} 个照片的 GPS 与设备信息，<b>保留拍摄时间</b>。是否继续？</p>
      </Modal>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={projectId}
        parentFolderId={folderId}
        folderPath={folderPath}
        defaultPointId={pointFilter !== 'all' ? pointFilter : undefined}
      />
      <FilePreview material={preview} materials={childMaterials} onChange={setPreview} open={!!preview} onClose={() => setPreview(null)} />
      <ShareCreateModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        projectId={projectId}
        presetFolders={selectedFolders}
        presetMaterials={selected}
      />
    </Layout>
  )
}

export default ProjectFiles