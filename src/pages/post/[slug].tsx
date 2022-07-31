import Prismic from '@prismicio/client';
import { format, minutesToHours } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { ReactElement, useCallback } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Content {
  heading: string;
  body: Record<string, unknown>[];
}

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: Content[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const dateFormat = useCallback(
    (date: string | Date): string =>
      format(new Date(date), 'dd MMM yyyy', { locale: ptBR }),
    []
  );

  function calculateReadingTime(content: Content[]): string {
    const getHeadingWordsPerMinutes = content.reduce((acc, currentValue) => {
      return currentValue.heading.split(/\s+/).length + acc;
    }, 0);

    const getBodyWordsPerMinutes = content.reduce((acc, currentValue) => {
      return RichText.asText(currentValue.body).split(/\s+/).length + acc;
    }, 0);

    const getWordsPerMinutes = Math.ceil(
      (getHeadingWordsPerMinutes + getBodyWordsPerMinutes) / 200
    );

    if (getWordsPerMinutes < 1) {
      return 'Rápida leitura';
    }

    if (getWordsPerMinutes < 60) {
      return `${getWordsPerMinutes} min`;
    }

    return `${minutesToHours(getWordsPerMinutes)} horas`;
  }

  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Header />
      {post && (
        <main className={styles.contentContainer}>
          <article className={styles.post}>
            <img
              className={styles.bannerimage}
              src={post.data?.banner?.url}
              alt={post.data?.title}
            />

            <h1>{post.data?.title}</h1>
            <div className={styles.info}>
              <span>
                <FiCalendar /> {dateFormat(post.first_publication_date)}
              </span>
              <span>
                <FiUser />
                {post.data?.author}
              </span>
              <span>
                <FiClock />
                {calculateReadingTime(post.data?.content)}
              </span>
            </div>
            <section className={styles.postContent}>
              {(post.data?.content ?? []).map(item => (
                <div key={item.heading}>
                  <h1>{item.heading}</h1>
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(item.body),
                    }}
                  />
                </div>
              ))}
            </section>
          </article>
        </main>
      )}
    </>
  );
}

export const getStaticPaths = async (): Promise<any> => {
  const client = getPrismicClient();
  const posts = await client.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
    }
  );

  const params = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps = async ({ params }): Promise<any> => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const { data, uid, first_publication_date } = response;

  const post: Post = {
    uid,
    data: {
      title: data.title,
      subtitle: data.subtitle,
      banner: {
        url: data.banner.url ?? '',
      },
      author: data.author,
      content: data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
    first_publication_date,
  };

  return {
    props: { post },
  };
};
