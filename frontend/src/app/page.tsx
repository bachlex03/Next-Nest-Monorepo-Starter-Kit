import Image from 'next/image'
import styles from './page.module.css'
import Button from '~/components/app/SampleComponent'
import { ThemeToggle } from '~/components/app/ThemeToggle'

export default function Home() {
  return (
    <div>
      <h1 className=''>Root page</h1>
      <ThemeToggle />
    </div>
  )
}
