import React from 'react'

type SideBarProps = {
  className?: string;
}

function SideBar({className}:SideBarProps) {
  return (
    <div className={`${className}`}>SideBar</div>
  )
}

export default SideBar