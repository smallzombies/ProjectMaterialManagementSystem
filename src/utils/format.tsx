import type { FileType } from '../types'
import { FileOutlined, FilePdfOutlined, FileTextOutlined, PictureOutlined, PlaySquareOutlined, FileZipOutlined, CodeSandboxOutlined, ApartmentOutlined } from '@ant-design/icons'

export function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

export function fmtDate(s?: string): string {
  if (!s) return '-'
  return s.slice(0, 10) + ' ' + s.slice(11, 16)
}
export function fmtDateShort(s?: string): string {
  if (!s) return '-'
  return s.slice(0, 10)
}

export function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

export function typeOf(name: string): FileType {
  const ext = extOf(name)
  const imgs = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'tif', 'tiff']
  const vids = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm']
  const pdfs = ['pdf']
  const cads = ['dwg', 'dxf', 'dwt']
  const offices = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'wps', 'et']
  const zips = ['zip', 'rar', '7z', 'tar', 'gz']
  const models = ['osgb', 'obj', '3dtiles', 'b3dm', 'i3dm']
  const clouds = ['las', 'laz', 'ply', 'pcd']
  if (imgs.includes(ext)) return 'image'
  if (vids.includes(ext)) return 'video'
  if (pdfs.includes(ext)) return 'pdf'
  if (cads.includes(ext)) return 'cad'
  if (offices.includes(ext)) return 'office'
  if (zips.includes(ext)) return 'zip'
  if (models.includes(ext)) return 'model'
  if (clouds.includes(ext)) return 'pointcloud'
  return 'other'
}

export const TYPE_LABEL: Record<FileType, string> = {
  image: '照片',
  video: '视频',
  pdf: 'PDF',
  cad: 'CAD',
  office: '文档',
  zip: '压缩包',
  model: '三维模型',
  pointcloud: '点云',
  other: '其他',
}

export function fileIcon(type: FileType) {
  switch (type) {
    case 'image':
      return <PictureOutlined style={{ color: '#2f54eb' }} />
    case 'video':
      return <PlaySquareOutlined style={{ color: '#722ed1' }} />
    case 'pdf':
      return <FilePdfOutlined style={{ color: '#cf1322' }} />
    case 'cad':
      return <ApartmentOutlined style={{ color: '#fa8c16' }} />
    case 'office':
      return <FileTextOutlined style={{ color: '#1677ff' }} />
    case 'zip':
      return <FileZipOutlined style={{ color: '#d4b106' }} />
    case 'model':
      return <CodeSandboxOutlined style={{ color: '#13c2c2' }} />
    case 'pointcloud':
      return <CodeSandboxOutlined style={{ color: '#52c41a' }} />
    default:
      return <FileOutlined />
  }
}

export const IMG_EXT = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']

export function thumbUrl(name: string, id: string): string {
  if (IMG_EXT.includes(extOf(name))) return `https://picsum.photos/seed/${id}/300/220`
  return ''
}

export function previewUrl(_name: string, id: string): string {
  return `https://picsum.photos/seed/${id}/1000/750`
}