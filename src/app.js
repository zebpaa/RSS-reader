import * as yup from 'yup';
import i18next from 'i18next';
import uniqueId from 'lodash/uniqueId.js';
import watch from './view.js';
import locales from './locales/index.js';

const elements = {
  form: document.querySelector('.rss-form'),
  input: document.querySelector('#url-input'),
  feedback: document.querySelector('.feedback'),
  posts: document.querySelector('.posts'),
  feeds: document.querySelector('.feeds'),
  modal: document.querySelector('.modal'),
};

const convertHtmlToDom = (text) => {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'application/xml');
};

export default async () => {
  const initialState = {
    // status: 'loading', // 'loading', 'success', 'fail'
    form: {
      valid: false,
      errors: [],
    },
    loadedFeeds: [],
    contents: {
      feeds: [],
      posts: [],
    },
    ui: {
      seenPosts: [], // или {}
    },
  };

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
          .notOneOf(watchedState.loadedFeeds), // .notOneOf() поможет избежать дубли
      });

      await schema.validate(newRss, { abortEarly: false });
      // watchedState.form.valid = true;
      watchedState.form.errors = [];
      const id = uniqueId();

      fetch(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(newRss.url)}`)
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error('Network response was not ok.');
        })
        .then((data) => {
          const feed = {
            url: newRss.url,
            title: '',
            description: '',
            id,
          };

          const posts = [];

          const doc = convertHtmlToDom(data.contents);
          console.log('doc: ', doc);
          const feedTitle = doc.querySelector('title');
          if (feedTitle.innerHTML.includes('[CDATA[')) {
            [feed.title] = feedTitle.innerHTML.split('[CDATA[')[1].split(']]');
          } else {
            feed.title = feedTitle.textContent;
          }
          const feedDescription = doc.querySelector('description');
          if (feedDescription.innerHTML.includes('[CDATA[')) {
            [feed.description] = feedDescription.innerHTML.split('[CDATA[')[1].split(']]');
          } else {
            feed.description = feedDescription.textContent;
          }
          watchedState.contents.feeds.unshift(feed);
          const items = doc.querySelectorAll('item');
          items.forEach((item) => {
            const post = {
              title: '',
              url: '',
              description: '',
              feedId: id,
              id: uniqueId(),
            };
            const itemTitle = item.querySelector('title');
            if (itemTitle.innerHTML.includes('[CDATA[')) {
              [post.title] = itemTitle.innerHTML.split('[CDATA[')[1].split(']]');
            } else {
              post.title = itemTitle.textContent;
            }
            const itemDescription = item.querySelector('description');
            if (itemDescription.innerHTML.includes('[CDATA[')) {
              [post.description] = itemDescription.innerHTML.split('[CDATA[')[1].split(']]');
            } else {
              post.description = itemDescription.textContent;
            }
            const itemLink = item.querySelector('link');
            post.url = itemLink.textContent;

            posts.push(post);
          });
          watchedState.contents.posts.unshift(...posts);
        });

      watchedState.loadedFeeds.push(newRss.url);
    } catch (err) {
      const validationErrors = err.inner.reduce((acc, cur) => {
        const { path, message } = cur;
        const errorData = acc[path] || [];
        return { ...acc, [path]: [...errorData, message] };
      }, {});
      console.log('Есть ошибки! validationErrors: ', validationErrors);
      // watchedState.form.valid = false;
      watchedState.form.errors = validationErrors;
    }
  });
};
