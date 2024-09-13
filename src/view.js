import onChange from 'on-change';

export default (elements, i18n, state) => {
  const {
    form, input, feedback, posts, feeds, modal,
  } = elements;

  // Генерация нужных данных в модалке
  const fillModalInfo = (id) => {
    const currentPost = state.contents.posts.find((post) => String(post.id) === id);
    const title = modal.querySelector('.modal-title');
    const description = modal.querySelector('.modal-body');
    title.textContent = currentPost.title;
    description.textContent = currentPost.description;

    const link = modal.querySelector('a[role="button"]');
    link.href = currentPost.url;
  };

  // Генерация фидов
  const createFeeds = () => {
    feeds.innerHTML = '';
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    feeds.append(card);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    card.append(cardBody);

    const h2 = document.createElement('h2');
    h2.classList.add('card-title', 'h4');
    h2.textContent = i18n.t('feeds');
    cardBody.append(h2);

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    card.append(ul);

    state.contents.feeds.forEach((feed) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'border-0', 'border-end-0');
      ul.append(li);

      const h3 = document.createElement('h3');
      h3.classList.add('h6', 'm-0');
      h3.textContent = feed.title;
      li.append(h3);

      const p = document.createElement('p');
      p.classList.add('m-0', 'small', 'text-black-50');
      p.textContent = feed.description;
      li.append(p);
    });
  };

  // Генерация постов
  const createPosts = () => {
    posts.innerHTML = '';
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    posts.append(card);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    card.append(cardBody);

    const h2 = document.createElement('h2');
    h2.classList.add('card-title', 'h4');
    h2.textContent = i18n.t('posts.title');
    cardBody.append(h2);

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    card.append(ul);

    state.contents.posts.forEach((post) => {
      const li = document.createElement('li');
      li.classList.add(
        'list-group-item',
        'd-flex',
        'justify-content-between',
        'align-items-start',
        'border-0',
        'border-end-0',
      );
      ul.append(li);

      const a = document.createElement('a');
      a.href = post.url;
      if (state.ui.seenPosts.includes(post.url)) {
        a.classList.add('fw-normal', 'link-secondary');
      } else {
        a.classList.add('fw-bold');
      }
      a.setAttribute('data-id', post.id);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.textContent = post.title;
      li.append(a);

      a.addEventListener('click', () => {
        a.classList.remove('fw-bold');
        a.classList.add('fw-normal', 'link-secondary');
        state.ui.seenPosts.push(post.url);
      });

      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.setAttribute('data-id', post.id);
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      button.textContent = i18n.t('posts.button');
      li.append(button);

      button.addEventListener('click', (event) => {
        a.classList.remove('fw-bold');
        a.classList.add('fw-normal', 'link-secondary');
        state.ui.seenPosts.push(post.url);
        const { id } = event.target.dataset;
        fillModalInfo(id);
      });
    });
  };

  const handleErrors = () => {
    if (!state.form.errors.url) {
      input.classList.remove('is-invalid');
      feedback.textContent = '';
    } else {
      input.classList.add('is-invalid');
      const [errorText] = state.form.errors.url;
      feedback.classList.add('text-danger');
      feedback.textContent = i18n.t(errorText);
    }
  };

  const hangleSuccess = () => {
    input.classList.remove('is-invalid');
    feedback.classList.add('text-success');
    feedback.classList.remove('text-danger');
    feedback.textContent = i18n.t('success');
    form.reset();
    input.focus();
  };

  const render = (path) => {
    switch (path) {
      case 'contents.feeds':
        createFeeds();
        break;
      case 'contents.posts':
        createPosts();
        break;
      case 'form.errors':
        handleErrors();
        break;
      case 'loadedFeeds':
        console.log('state.loadedFeeds: ', state.loadedFeeds);
        hangleSuccess();
        break;
      default:
        console.log('Что-то пошло не так! path: ', path);
        break;
    }
  };

  const watchedState = onChange(state, render);

  return watchedState;
};
