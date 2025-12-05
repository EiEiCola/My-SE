import React from 'react'

type RightPanelProps = {
  className?:string;
}

function RightPanel({className}:RightPanelProps) {
  return (
    <div className={`${className}`}>RightPanel</div>
  )
}

export default RightPanel