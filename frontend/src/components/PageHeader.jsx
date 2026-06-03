import React from "react"
import { Button } from "./ui/button.jsx"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const PageHeader = ({ icon, title, backLink="/", backToPageLabel="Back to Home" }) => {
  const navigate = useNavigate();

  return (
    <div className='flex flex-col justify-between gap-5 mb-12'>
        <div className="w-fit">
            <Button
                variant='outline'
                size='sm'
                className='mb-2 bg-none border-none'
                onClick={() => navigate(backLink)}
            >
                <ArrowLeft className='size-4'/>
                {backToPageLabel}
            </Button>
        </div>

      <div className='flex items-center gap-2'>
        <h1 className='text-4xl md:text-6xl gradient-title'>
            {title}
        </h1>
      </div>
    </div>
  )
}

export default PageHeader