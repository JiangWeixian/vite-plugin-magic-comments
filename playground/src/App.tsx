import React from 'react'
import { useRoutes, BrowserRouter } from 'react-router-dom'
import routes from '~react-pages'

const Home = import(
  /* webpackInclude: /\.json$/ */
  /* webpackExclude: /\.noimport\.json$/ */
  /* webpackChunkName: "my-chunk-name" */
  /* webpackMode: "lazy" */
  /* webpackPrefetch: true */
  /* webpackPreload: true */ './pages/index'
)
const Button = import(
  /* webpackInclude: /\.json$/ */
  /* webpackExclude: /\.noimport\.json$/ */
  /* webpackChunkName: "my-button-chunk-name" */
  /* webpackMode: "lazy" */
  /* webpackPrefetch: true */
  /* webpackPreload: true */ './components/button'
)
console.log(Button)
console.log(Home)

const Routes = () => {
  const elements = useRoutes(routes)
  return elements
}

function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div>loading...</div>}>
        <Routes />
      </React.Suspense>
    </BrowserRouter>
  )
}

export default App
