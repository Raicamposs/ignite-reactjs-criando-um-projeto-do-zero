import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { ReactElement, useCallback, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  const dateFormat = useCallback(
    (date: string | Date): string =>
      format(new Date(date), 'dd MMM yyyy', { locale: ptBR }),
    []
  );

  async function handleNextPage(): Promise<void> {
    try {
      const response = await fetch(nextPage);
      const data = await response.json();

      setNextPage(data.next_page);

      const newPosts: Post[] = data.results.map(post => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: post.data,
      }));

      setPosts(prevState => [...prevState, ...newPosts]);
    } catch (err) {
      throw new Error(err);
    }
  }

  return (
    <>
      <Header />
      <main className={styles.contentContainer}>
        {!posts && <p>Carregando...</p>}
        {posts &&
          posts.map(post => (
            <section className={styles.post} key={post.uid}>
              <Link href={`post/${post.uid}`}>
                <h3>{post.data.title}</h3>
              </Link>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <span>
                  <FiCalendar /> {dateFormat(post.first_publication_date)}
                </span>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
              </div>
            </section>
          ))}

        {nextPage && (
          <button
            onClick={handleNextPage}
            type="button"
            className={styles.button}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps = async ({ req }): Promise<any> => {
  const prismic = getPrismicClient(req);

  const { results, next_page } = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: [
        'uid',
        'first_publication_date',
        'data.title',
        'data.author',
        'data.subtitle',
      ],
      pageSize: 1,
    }
  );

  return {
    redirect: 30 * 60,
    props: {
      postsPagination: {
        next_page,
        results: results.map(post => ({
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: post.data,
        })),
      },
    },
  };
};
