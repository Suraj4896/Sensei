import React, { Suspense } from "react";
import { ScaleLoader } from "react-spinners";

const layout = ({ children }) => {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">Industry Insights</h1>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center items-center mt-50">
            {/* size is in pixels */}
            <ScaleLoader height={100} margin={6} barCount={10} color="gray" />
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
};

export default layout;
