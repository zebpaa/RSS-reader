import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import watch from './view.js';
import locales from './locales/index.js';
import parse from './parser.js';

const getUrl = (rssUrl) => {
  const url = new URL('/get', 'https://allorigins.hexlet.app');
  url.searchParams.set('disableCache', true);
  url.searchParams.set('url', rssUrl);
  return url.toString();
};

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.querySelector('.modal'),
    submitButton: document.querySelector('form button'),
  };

  const initialState = {
    status: 'filling', // 'loading'
    form: {
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

  const i18n = i18next.createInstance();
  i18n.init({
    lng: 'ru',
    debug: false,
    resources: locales,
  });

  const watchedState = watch(elements, i18n, initialState);

  const getNewPosts = () => {
    const titlesOfPosts = watchedState.contents.posts.map(({ title }) => title);
    const arrayOfPromises = watchedState.loadedFeeds.map(([url, idOfFeed]) => axios.get(getUrl(url))
      .then((response) => {
        const { posts } = parse(response.data);
        const newPosts = posts.filter((post) => !titlesOfPosts.includes(post.title)).map((item) => {
          const feedId = idOfFeed;
          return { ...item, feedId };
        });
        if (watchedState.loadedFeeds.length > 0) {
          watchedState.contents.posts = [...newPosts, ...watchedState.contents.posts];
        }
      }).catch((error) => {
        console.log('error: ', error);
      }));
    Promise.all(arrayOfPromises).finally(() => {
      setTimeout(() => getNewPosts(), 5000);
    });
  };

  getNewPosts();

  yup.setLocale({
    mixed: {
      required: 'errors.required',
      notOneOf: 'errors.rssAlreadyExists',
    },
    string: {
      url: 'errors.invalidForm',
    },
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newRss = Object.fromEntries(formData);

    const schema = yup.object().shape({
      url: yup.string().required().url().notOneOf(watchedState.loadedFeeds.map(([url]) => url)),
    });

    schema
      .validate(newRss, { abortEarly: false })
      .then((data) => {
        watchedState.status = 'loading';

        axios
          .get(getUrl(data.url), { timeout: 5000 })
          .then((response) => {
            if (response.status === 200) {
              const { feed, posts } = parse(response.data);
              watchedState.contents.feeds.unshift(feed);
              watchedState.contents.posts = [
                ...posts,
                ...watchedState.contents.posts,
              ];
              watchedState.loadedFeeds.push([data.url, feed.id]);
              watchedState.status = 'filling';
            } else {
              throw new Error('errors.urlIsNotRSS');
            }
          })
          .catch((error) => {
            const { message } = error;
            watchedState.form.errors = (message === 'timeout of 5000ms exceeded') ? 'errors.timeout' : message;
            watchedState.status = 'filling';
          });
      })
      .catch((err) => {
        const { message } = err;
        watchedState.form.errors = message;
        watchedState.status = 'filling';
      });
  });

  elements.posts.addEventListener('click', (event) => {
    if (event.target.dataset.id) {
      const { id } = event.target.dataset;
      watchedState.contents.posts.forEach((post) => {
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
