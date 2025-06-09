import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import MainPage from './pages/main/main.page'

import './index.sass'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MainPage />
	</StrictMode>,
)
