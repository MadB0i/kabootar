import useRouter from './lib/useRouter'
import Creator from './pages/Creator'
import Viewer from './pages/Viewer'

export default function App() {
  const { page, data } = useRouter()

  if (page === 'viewer') return <Viewer key={data} data={data} />
  return <Creator />
}
