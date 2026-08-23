'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{`© ${new Date().getFullYear()}, Made with `}</span>
        <span>{`❤️`}</span>
        <span className='text-textSecondary'>{` by `}</span>
        <Link href='https://github.com/LucasVizoto' target='_blank' className='text-primary'>
          Ana Laura and Lucas Vizoto
        </Link>
      </p>
      {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          <Link href='https://opensource.org/license/MIT' target='_blank' className='text-primary'>
            License
          </Link>
          <Link
            href={`${process.env.NEXT_PUBLIC_API_URL}/api`}
            target='_blank'
            className='text-primary'
          >
            Documentation
          </Link>
        </div>
      )}
    </div>
  )
}

export default FooterContent
