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

// Ссылка должна быть валидным URL
export default async () => {
  const initialState = {
    // status: 'loading', // 'loading', 'success', 'fail'
    form: {
      // status: null,
      valid: false,
      errors: [],
    },
    loadedFeeds: [],
    contents: {
      feeds: [
        {
          title: 'Feed 1',
          description: 'Это описание 1-го фида',
          id: uniqueId(),
        },
        {
          title: 'Feed 2',
          description: 'Это описание 2-го фида',
          id: uniqueId(),
        },
      ],
      posts: [
        {
          title: 'Пост 1',
          url: '',
          description: 'Описание 1',
          feedId: 2,
          id: 1,
        },
        {
          title: 'Пост 2',
          url: '',
          description: 'Описание 2',
          feedId: 2,
          id: 2,
        },
        {
          title: 'Пост 3',
          url: '',
          description: 'Описание 3',
          feedId: 2,
          id: 3,
        },
      ],
    },
    // loadingProcess: {},
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
      watchedState.contents.feeds.unshift({
        title: 'Feed Next',
        description: 'Это описание Next-го фида',
        id,
      });
      watchedState.contents.posts.unshift({
        title: 'Пост Next',
        url: newRss.url,
        description: 'Описание Next',
        feedId: id,
        id: uniqueId(),
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
