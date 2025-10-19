import React from 'react'
import Slider from '../../components/entertainment/home/Slider'
import Menu from '../../components/entertainment/Menu'
import Header from '../../components/Header'

const Home = () => {
  return (
    <div>
      <Header />
      <Menu />
      <div className="mt-6">
        <Slider />
      </div>
    </div>
  )
}

export default Home
