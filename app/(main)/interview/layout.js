import React, { Suspense } from 'react'
import { ScaleLoader } from 'react-spinners';

const layout = ({children}) => {
  return (
    <div className='px-5'>
        <Suspense fallback={<div className="flex justify-center items-center mt-50">
            {/* size is in pixels */}
            <ScaleLoader height={100} margin={6} barCount={10} color="gray" />
          </div>}>
            {children}
        </Suspense>
    </div>
  )
}

export default layout