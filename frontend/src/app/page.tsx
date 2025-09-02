import Image from 'next/image'
import styles from './page.module.css'
import Button from '~/components/app/SampleComponent'
import { ThemeToggle } from '~/components/app/ThemeToggle'

export default function Home() {
  return (
    <div>
      <h1 className='mr-5 w-5 bg-amber-300 px-3 pt-5 text-2xl font-bold underline dark:bg-green-500'>Hello world!</h1>
      <ThemeToggle />
    </div>
  )
}
