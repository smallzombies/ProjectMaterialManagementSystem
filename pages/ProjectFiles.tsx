import { useParams } from 'react-router-dom'

const ProjectFiles: React.FC = () => {
  const { projectId } = useParams()
  
  return (
    <div>
      <h1>项目文件</h1>
      <p>项目 ID: {projectId}</p>
    </div>
  )
}

export default ProjectFiles
