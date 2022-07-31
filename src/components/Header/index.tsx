import Link from 'next/link';
import { ReactElement } from 'react';
import styles from './header.module.scss';

export default function Header(): ReactElement {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <a>
          <img src="/images/logo.svg" alt="logo" aria-label="logo" />
        </a>
      </Link>
    </header>
  );
}
