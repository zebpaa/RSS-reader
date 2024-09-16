import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import watch from './view.js';
import locales from './locales/index.js';
import parse from './parser.js';

const elements = {
  form: document.querySelector('.rss-form'),
  input: document.querySelector('#url-input'),
  feedback: document.querySelector('.feedback'),
  posts: document.querySelector('.posts'),
  feeds: document.querySelector('.feeds'),
  modal: document.querySelector('.modal'),
  submitButton: document.querySelector('form button'),
};

const getUrl = (rssUrl) => {
  const url = new URL('/get', 'https://allorigins.hexlet.app');
  url.searchParams.set('disableCache', true);
  url.searchParams.set('url', rssUrl);
  return url.toString();
};

export default async () => {
  const initialState = {
    status: 'filling', // 'loading', 'success', 'fail'
    form: {
      valid: false,
      errors: '',
    },
    loadedFeeds: [],
    contents: {
      feeds: [],
      posts: [],
    },
    ui: {
      seenPosts: [],
    },
    modal: {
      title: '',
      description: '',
      id: '',
      href: '',
    },
  };

  // const getNewPosts = () => {
  //   if (initialState.loadedFeeds.length === 0) {
  //     console.log('Массив пустой!');
  //   } else {
  //     initialState.loadedFeeds.forEach(async (url) => {
  //       try {
  //         const response = await axios.get(getUrl(url));
  //         const { feed, posts } = parse(response.data);
  //         posts.filter((post) => {

  //         });

  //         console.log('feed: ', feed, '\n', 'posts: ', posts);
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     });
  //   }
  // };

  // setTimeout(() => getNewPosts(), 2000);

  const i18n = i18next.createInstance();
  await i18n.init({
    lng: 'ru',
    debug: false,
    resources: locales,
  });

  const watchedState = watch(elements, i18n, initialState);

  yup.setLocale({
    mixed: {
      required: 'errors.required',
      notOneOf: 'errors.rssAlreadyExists',
    },
    string: {
      url: 'errors.invalidForm',
    },
  });

  elements.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newRss = Object.fromEntries(formData);

    try {
      // Cхема в библиотеке Yup проверяет условия в момент создания схемы, а не динамически
      // в реальном времени. Каждый раз при проверке данных будет создаваться новая схема.
      const schema = yup.object().shape({
        url: yup.string().required().url()
          .notOneOf(watchedState.loadedFeeds),
      });

      await schema.validate(newRss, { abortEarly: false });
      watchedState.status = 'loading';

      // watchedState.form.valid = true;

      axios.get(getUrl(newRss.url))
        .then((response) => {
          if (response.status === 200) {
            const { feed, posts } = parse(response.data);
            watchedState.contents.feeds.unshift(feed);
            watchedState.contents.posts.unshift(...posts);
            watchedState.loadedFeeds.push(newRss.url);
            watchedState.status = 'filling';
          } else {
            throw new Error('errors.urlIsNotRSS');
          }
        })
        .catch((error) => {
          const { message } = error;
          watchedState.form.errors = message;
          watchedState.status = 'filling';
        });
    } catch (err) {
      const { message } = err;
      // watchedState.form.valid = false;
      watchedState.form.errors = message;
      watchedState.status = 'filling';
    }
  });

  // elements.form.addEventListener('submit', async (event) => {
  //   event.preventDefault();

  //   const formData = new FormData(event.target);
  //   const newRss = Object.fromEntries(formData);

  //   try {
  //     // Cхема в библиотеке Yup проверяет условия в момент создания схемы, а не динамически
  //     // в реальном времени. Каждый раз при проверке данных будет создаваться новая схема.
  //     const schema = yup.object().shape({
  //       url: yup.string().required().url()
  //         .notOneOf(watchedState.loadedFeeds), // .notOneOf() поможет избежать дубли
  //     });

  //     await schema.validate(newRss, { abortEarly: false });
  //     watchedState.status = 'loading';

  //     // watchedState.form.valid = true;
  //     watchedState.form.errors = [];

  //     fetch(getUrl(newRss.url))
  //       .then((response) => {
  //         // console.log('fetchResponse: ', response);
  //         if (response.ok) return response.json();
  //         throw new Error('Network response was not ok.');
  //       })
  //       .then((data) => {
  //         const { feed, posts } = parse(data);

  //         watchedState.contents.feeds.unshift(feed);
  //         watchedState.contents.posts.unshift(...posts);
  //       });

  //     watchedState.loadedFeeds.push(newRss.url);
  //     watchedState.status = 'filling';
  //   } catch (err) {
  //     const validationErrors = err.inner.reduce((acc, cur) => {
  //       const { path, message } = cur;
  //       const errorData = acc[path] || [];
  //       return { ...acc, [path]: [...errorData, message] };
  //     }, {});
  //     console.log('Есть ошибки! validationErrors: ', validationErrors);
  //     // watchedState.form.valid = false;
  //     watchedState.form.errors = validationErrors;
  //     watchedState.status = 'filling';
  //   }
  //   console.log('state: ', initialState);
  // });

  elements.posts.addEventListener('click', (event) => {
    if (event.target.dataset.id) {
      const { id } = event.target.dataset;
      initialState.contents.posts.forEach((post) => {
        if (post.id === id) {
          watchedState.modal = {
            title: post.title,
            description: post.description,
            href: post.url,
            id: post.id,
          };
          watchedState.ui.seenPosts.push(post.id);
        }
      });
    }
  });
};
