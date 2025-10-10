import React from 'react'

const Notfound = () => {
  return (
    <div className='flex flex-col justify-center items-center h-screen main-h-screen text-center bg-state-50'>
        <img src="../public/404_NotFound.png" alt="404 Not Found" className='w-1/3 mb-8'/>
      <p className='text-xl font-semibold'>Sorry , you are entering a restricted area</p>
      <a href="/" className='text-blue-500 hover:underline bg-blue-100 '>Go to Login</a>
    </div>
  )
}

export default Notfound
